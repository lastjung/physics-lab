import { SimulationPlugin, PluginContext } from './types';
import { SceneEditorSimulation } from '../simulations/sceneEditor';
import { SimulationRunner } from '../core/simulationRunner';
import {
  JointCreationPreview,
  SceneEditorCanvasRenderer,
  SelectionBoxPreview
} from '../render/sceneEditorCanvasRenderer';
import { Joint } from '../engine2d/joints/types';

const clampFinite = (v: unknown, fallback = 0): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const getAnchorWorld = (body: any, local: { x: number; y: number }) => {
  const cos = Math.cos(body.angle);
  const sin = Math.sin(body.angle);
  return {
    x: body.x + (local.x * cos - local.y * sin),
    y: body.y + (local.x * sin + local.y * cos)
  };
};

export const sceneEditorPlugin: SimulationPlugin = {
  id: 'scene-editor',
  create(context: PluginContext) {
    const STORAGE_KEY = 'physics-lab-scene-editor';
    const model = new SceneEditorSimulation();
    const renderer = new SceneEditorCanvasRenderer(context.canvas);

    let cachedBodies = model.getBodies();
    let cachedJoints = model.getJoints();

    let selectedIds = new Set<string>();
    let primarySelectedId: string | null = null;

    let isDragging = false;
    let draggingPointerId: number | null = null;
    let dragOriginWorld: { x: number; y: number } | null = null;
    const dragStartPositions = new Map<string, { x: number; y: number }>();
    let pendingTouchDragBodyId: string | null = null;
    let pendingTouchDragPointerId: number | null = null;
    let pendingTouchDragStartWorld: { x: number; y: number } | null = null;

    let isBoxSelecting = false;
    let selectionBoxStart: { x: number; y: number } | null = null;
    let selectionBoxCurrent: { x: number; y: number } | null = null;
    let boxSelectionAdditive = false;

    let jointMode: 'revolute' | 'prismatic' | 'weld' | null = null;
    let pendingBodyA: string | null = null;
    let pendingAnchorWorld: { x: number; y: number } | null = null;
    let pointerWorld: { x: number; y: number } | null = null;

    let snapEnabled = false;
    let snapStep = 0.1;
    let anchorSnapEnabled = true;
    let angleSnapEnabled = true;
    let angleSnapStepDeg = 15;

    let uiNotice: string | null = null;
    let saveTimer: number | null = null;
    let redrawQueued = false;
    const TOUCH_DRAG_THRESHOLD = 0.06;

    const refreshCaches = () => {
      cachedBodies = model.getBodies();
      cachedJoints = model.getJoints();
    };

    const saveSceneNow = () => {
      localStorage.setItem(STORAGE_KEY, model.serialize());
    };

    const queueSaveScene = () => {
      if (saveTimer !== null) window.clearTimeout(saveTimer);
      saveTimer = window.setTimeout(() => {
        saveSceneNow();
        saveTimer = null;
      }, 180);
    };

    const flushSaveScene = () => {
      if (saveTimer !== null) {
        window.clearTimeout(saveTimer);
        saveTimer = null;
      }
      saveSceneNow();
    };

    const loadScene = () => {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return;
      model.deserialize(data);
      refreshCaches();
    };

    const toWorldFromEvent = (e: PointerEvent) => {
      const rect = context.canvas.getBoundingClientRect();
      return renderer.screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
    };

    const snapValue = (v: number) => {
      if (!snapEnabled) return v;
      return Math.round(v / snapStep) * snapStep;
    };

    const snapAnchor = (p: { x: number; y: number }) => {
      if (!anchorSnapEnabled) return p;
      return { x: snapValue(p.x), y: snapValue(p.y) };
    };

    const snapAngle = (rad: number) => {
      if (!angleSnapEnabled || angleSnapStepDeg <= 0) return rad;
      const step = (angleSnapStepDeg * Math.PI) / 180;
      return Math.round(rad / step) * step;
    };

    const unitDir = (v: { x: number; y: number }) => {
      const len = Math.hypot(v.x, v.y);
      if (len < 1e-8) return { x: 1, y: 0 };
      return { x: v.x / len, y: v.y / len };
    };

    const snappedAxis = (from: { x: number; y: number }, to: { x: number; y: number }) => {
      const raw = { x: to.x - from.x, y: to.y - from.y };
      const dir = unitDir(raw);
      const angle = Math.atan2(dir.y, dir.x);
      const snapped = snapAngle(angle);
      return { x: Math.cos(snapped), y: Math.sin(snapped) };
    };

    const clearSelection = () => {
      selectedIds.clear();
      primarySelectedId = null;
    };

    const setSingleSelection = (id: string | null) => {
      selectedIds = new Set(id ? [id] : []);
      primarySelectedId = id;
    };

    const toggleSelection = (id: string) => {
      if (selectedIds.has(id)) selectedIds.delete(id);
      else selectedIds.add(id);
      primarySelectedId = selectedIds.size > 0 ? id : null;
    };

    const selectedBodyIds = () => {
      return cachedBodies.filter(b => selectedIds.has(b.id) && b.id !== 'floor').map(b => b.id);
    };

    const startGroupDrag = (originWorld: { x: number; y: number }, pointerId: number) => {
      dragStartPositions.clear();
      selectedBodyIds().forEach(id => {
        const body = cachedBodies.find(b => b.id === id);
        if (body) dragStartPositions.set(id, { x: body.x, y: body.y });
      });
      isDragging = dragStartPositions.size > 0;
      draggingPointerId = isDragging ? pointerId : null;
      dragOriginWorld = isDragging ? originWorld : null;
    };

    const intersectsSelectionRect = (
      body: any,
      minX: number,
      maxX: number,
      minY: number,
      maxY: number
    ) => {
      const hx = body.shape === 'circle' ? body.radius : body.halfW;
      const hy = body.shape === 'circle' ? body.radius : body.halfH;
      const bMinX = body.x - hx;
      const bMaxX = body.x + hx;
      const bMinY = body.y - hy;
      const bMaxY = body.y + hy;
      return !(bMaxX < minX || bMinX > maxX || bMaxY < minY || bMinY > maxY);
    };

    const getJointPreview = (): JointCreationPreview | null => {
      if (!jointMode || !pendingAnchorWorld || !pointerWorld) return null;
      const to = jointMode === 'prismatic' ? snapAnchor(pointerWorld) : pointerWorld;
      return { from: pendingAnchorWorld, to, mode: jointMode };
    };

    const getSelectionBoxPreview = (): SelectionBoxPreview | null => {
      if (!isBoxSelecting || !selectionBoxStart || !selectionBoxCurrent) return null;
      return { from: selectionBoxStart, to: selectionBoxCurrent };
    };

    const redrawNow = () => {
      redrawQueued = false;
      renderer.setZoom(150);
      renderer.render(
        cachedBodies,
        cachedJoints,
        Array.from(selectedIds),
        getJointPreview(),
        getSelectionBoxPreview()
      );
    };

    const requestRedraw = () => {
      if (redrawQueued) return;
      redrawQueued = true;
      window.requestAnimationFrame(redrawNow);
    };

    const getBodyAtPoint = (x: number, y: number) => {
      for (let i = cachedBodies.length - 1; i >= 0; i--) {
        const b = cachedBodies[i];
        if (b.id === 'floor') continue;
        const dx = x - b.x;
        const dy = y - b.y;
        if (b.shape === 'circle') {
          if (dx * dx + dy * dy <= b.radius * b.radius) return b;
        } else if (b.shape === 'aabb') {
          if (Math.abs(dx) <= b.halfW! && Math.abs(dy) <= b.halfH!) return b;
        }
      }
      return null;
    };

    const getJointAtPoint = (x: number, y: number) => {
      const thresholdSq = 0.05 * 0.05;
      for (const j of cachedJoints) {
        const bodyA = cachedBodies.find(b => b.id === j.bodyIdA);
        if (!bodyA) continue;
        const a = getAnchorWorld(bodyA, j.localAnchorA);
        const dx = x - a.x;
        const dy = y - a.y;
        if (dx * dx + dy * dy <= thresholdSq) return j;
      }
      return null;
    };

    const applyJointValidation = (joint: Joint) => {
      if (joint.type === 'revolute') {
        const j = joint as any;
        j.motorSpeed = clampFinite(j.motorSpeed, 0);
        j.maxMotorTorque = Math.max(0, clampFinite(j.maxMotorTorque, 0));
        j.lowerAngle = clampFinite(j.lowerAngle, 0);
        j.upperAngle = clampFinite(j.upperAngle, 0);
        if (j.lowerAngle > j.upperAngle) {
          const t = j.lowerAngle;
          j.lowerAngle = j.upperAngle;
          j.upperAngle = t;
        }
      }
      if (joint.type === 'prismatic') {
        const j = joint as any;
        j.motorSpeed = clampFinite(j.motorSpeed, 0);
        j.maxMotorForce = Math.max(0, clampFinite(j.maxMotorForce, 0));
        j.lowerTranslation = clampFinite(j.lowerTranslation, 0);
        j.upperTranslation = clampFinite(j.upperTranslation, 0);
        if (j.lowerTranslation > j.upperTranslation) {
          const t = j.lowerTranslation;
          j.lowerTranslation = j.upperTranslation;
          j.upperTranslation = t;
        }
      }
    };

    const applyJointPreset = (preset: 'soft' | 'normal' | 'strong') => {
      if (!primarySelectedId) return;
      const joint = cachedJoints.find(j => j.id === primarySelectedId);
      if (!joint || joint.type === 'weld') return;

      if (joint.type === 'revolute') {
        const map = {
          soft: { motorSpeed: 2, maxMotorTorque: 20, lowerAngle: -Math.PI / 6, upperAngle: Math.PI / 6 },
          normal: { motorSpeed: 6, maxMotorTorque: 80, lowerAngle: -Math.PI / 2, upperAngle: Math.PI / 2 },
          strong: { motorSpeed: 12, maxMotorTorque: 200, lowerAngle: -2 * Math.PI / 3, upperAngle: 2 * Math.PI / 3 }
        } as const;
        model.updateJoint(joint.id, {
          motorEnabled: true,
          limitEnabled: true,
          ...map[preset]
        });
      } else if (joint.type === 'prismatic') {
        const map = {
          soft: { motorSpeed: 1.5, maxMotorForce: 80, lowerTranslation: -0.4, upperTranslation: 0.4 },
          normal: { motorSpeed: 4, maxMotorForce: 220, lowerTranslation: -1.0, upperTranslation: 1.0 },
          strong: { motorSpeed: 8, maxMotorForce: 600, lowerTranslation: -2.0, upperTranslation: 2.0 }
        } as const;
        model.updateJoint(joint.id, {
          motorEnabled: true,
          limitEnabled: true,
          ...map[preset]
        });
      }

      const updated = model.getJoints().find(j => j.id === joint.id);
      if (updated) applyJointValidation(updated);
      refreshCaches();
      queueSaveScene();
      uiNotice = `Preset applied: ${preset}`;
      requestRedraw();
    };

    const applySelectionProperty = (rawKey: string, rawValue: unknown) => {
      if (!primarySelectedId) return;
      const joint = cachedJoints.find(j => j.id === primarySelectedId);
      const body = cachedBodies.find(b => b.id === primarySelectedId);

      if (joint) {
        const updates: Record<string, unknown> = {};
        if (rawKey === 'lowerAngleDeg') updates.lowerAngle = (clampFinite(rawValue, 0) * Math.PI) / 180;
        else if (rawKey === 'upperAngleDeg') updates.upperAngle = (clampFinite(rawValue, 0) * Math.PI) / 180;
        else if (rawKey === 'maxMotorTorque' || rawKey === 'maxMotorForce') updates[rawKey] = Math.max(0, clampFinite(rawValue, 0));
        else if (rawKey === 'motorSpeed' || rawKey === 'lowerTranslation' || rawKey === 'upperTranslation') updates[rawKey] = clampFinite(rawValue, 0);
        else updates[rawKey] = rawValue;

        model.updateJoint(joint.id, updates as Partial<Joint>);
        const updated = model.getJoints().find(j => j.id === joint.id);
        if (updated) applyJointValidation(updated);
        refreshCaches();
      } else if (body && rawKey === 'friction') {
        body.friction = Math.max(0, clampFinite(rawValue, body.friction));
      }
    };

    const removeSelected = () => {
      if (!primarySelectedId) return;
      model.removeJoint(primarySelectedId);

      const bodies = model.getBodies();
      const idx = bodies.findIndex(b => b.id === primarySelectedId);
      if (idx !== -1 && bodies[idx].id !== 'floor') {
        const bodyId = bodies[idx].id;
        bodies.splice(idx, 1);
        const related = model.getJoints().filter(j => j.bodyIdA === bodyId || j.bodyIdB === bodyId).map(j => j.id);
        related.forEach(id => model.removeJoint(id));
      }

      selectedIds.delete(primarySelectedId);
      primarySelectedId = selectedIds.size > 0 ? Array.from(selectedIds)[0] : null;
      refreshCaches();
    };

    const applySelectionBox = () => {
      if (!selectionBoxStart || !selectionBoxCurrent) return;
      const minX = Math.min(selectionBoxStart.x, selectionBoxCurrent.x);
      const maxX = Math.max(selectionBoxStart.x, selectionBoxCurrent.x);
      const minY = Math.min(selectionBoxStart.y, selectionBoxCurrent.y);
      const maxY = Math.max(selectionBoxStart.y, selectionBoxCurrent.y);
      const next = boxSelectionAdditive ? new Set(selectedIds) : new Set<string>();

      for (const b of cachedBodies) {
        if (b.id === 'floor') continue;
        if (intersectsSelectionRect(b, minX, maxX, minY, maxY)) next.add(b.id);
      }

      selectedIds = next;
      primarySelectedId = selectedIds.size > 0 ? Array.from(selectedIds)[selectedIds.size - 1] : null;
    };

    const validateImportText = (text: string): { ok: true; data: any } | { ok: false; reason: string } => {
      let parsed: any;
      try {
        parsed = JSON.parse(text);
      } catch {
        return { ok: false, reason: 'Invalid JSON format.' };
      }

      if (!parsed || typeof parsed !== 'object') {
        return { ok: false, reason: 'Payload must be an object.' };
      }
      if (parsed.version !== undefined && !Number.isFinite(Number(parsed.version))) {
        return { ok: false, reason: 'version must be numeric when provided.' };
      }
      if (parsed.bodies !== undefined && !Array.isArray(parsed.bodies)) {
        return { ok: false, reason: 'bodies must be an array.' };
      }
      if (parsed.joints !== undefined && !Array.isArray(parsed.joints)) {
        return { ok: false, reason: 'joints must be an array.' };
      }
      if (parsed.params !== undefined && (typeof parsed.params !== 'object' || parsed.params === null)) {
        return { ok: false, reason: 'params must be an object.' };
      }

      return { ok: true, data: parsed };
    };

    const renderPropsPanel = () => {
      if (selectedIds.size > 1) {
        return `
          <div style="font-size: 0.85rem;">
            <strong>${selectedIds.size} items selected</strong>
            <p style="opacity: 0.7; margin-top: 8px;">Drag selected bodies together. Press Esc to clear.</p>
          </div>
        `;
      }

      if (!primarySelectedId) return `<p style="opacity: 0.5;">No selection</p>`;

      const body = cachedBodies.find(b => b.id === primarySelectedId);
      const joint = cachedJoints.find(j => j.id === primarySelectedId);

      if (body) {
        return `
          <div style="font-size: 0.85rem;">
            <strong>Body: ${body.id.split('_')[0]}</strong>
            <div style="margin-top: 8px;">
              Friction (>=0): <input type="number" step="0.1" min="0" class="prop-input" data-key="friction" value="${body.friction}">
            </div>
            <button id="del-obj" class="game-btn secondary" style="width: 100%; margin-top: 8px; color: #ef4444;">Delete</button>
          </div>
        `;
      }

      if (joint) {
        const isRev = joint.type === 'revolute';
        const isPrism = joint.type === 'prismatic';
        const isWeld = joint.type === 'weld';
        const j = joint as any;
        const warnings: string[] = [];

        if (isRev && j.motorEnabled && Math.max(0, clampFinite(j.maxMotorTorque, 0)) <= 0) {
          warnings.push('Motor is enabled but Max Torque is 0.');
        }
        if (isPrism && j.motorEnabled && Math.max(0, clampFinite(j.maxMotorForce, 0)) <= 0) {
          warnings.push('Motor is enabled but Max Force is 0.');
        }

        return `
          <div style="font-size: 0.85rem;">
            <strong>Joint: ${joint.type}</strong>
            <div style="display:flex; gap:6px; margin-top:8px;">
              <button class="joint-preset game-btn secondary" data-preset="soft">Soft</button>
              <button class="joint-preset game-btn secondary" data-preset="normal">Normal</button>
              <button class="joint-preset game-btn secondary" data-preset="strong">Strong</button>
            </div>
            <div style="margin-top: 8px; display: grid; gap: 4px;">
              ${!isWeld ? `
                <label><input type="checkbox" class="prop-input" data-key="motorEnabled" ${j.motorEnabled ? 'checked' : ''}> Motor</label>
                Speed: <input type="number" step="0.5" class="prop-input" data-key="motorSpeed" value="${clampFinite(j.motorSpeed, 0)}">
                ${isRev ? `Max Torque (>=0): <input type="number" step="1" min="0" class="prop-input" data-key="maxMotorTorque" value="${Math.max(0, clampFinite(j.maxMotorTorque, 0))}">` : ''}
                ${isPrism ? `Max Force (>=0): <input type="number" step="1" min="0" class="prop-input" data-key="maxMotorForce" value="${Math.max(0, clampFinite(j.maxMotorForce, 0))}">` : ''}
                <label><input type="checkbox" class="prop-input" data-key="limitEnabled" ${j.limitEnabled ? 'checked' : ''}> Limits</label>
                ${isRev ? `
                  Min Angle (deg): <input type="number" step="1" class="prop-input" data-key="lowerAngleDeg" value="${(clampFinite(j.lowerAngle, 0) * 180 / Math.PI).toFixed(1)}">
                  Max Angle (deg): <input type="number" step="1" class="prop-input" data-key="upperAngleDeg" value="${(clampFinite(j.upperAngle, 0) * 180 / Math.PI).toFixed(1)}">
                  <small style="opacity:0.65;">Tip: range is auto-corrected if Min > Max.</small>
                ` : ''}
                ${isPrism ? `
                  Min Dist: <input type="number" step="0.1" class="prop-input" data-key="lowerTranslation" value="${clampFinite(j.lowerTranslation, 0)}">
                  Max Dist: <input type="number" step="0.1" class="prop-input" data-key="upperTranslation" value="${clampFinite(j.upperTranslation, 0)}">
                  <small style="opacity:0.65;">Tip: range is auto-corrected if Min > Max.</small>
                ` : ''}
              ` : '<p>Rigid connection</p>'}
            </div>
            ${warnings.length > 0 ? `<div style="margin-top:8px; color:#b45309;">${warnings.join('<br>')}</div>` : ''}
            <button id="del-obj" class="game-btn secondary" style="width: 100%; margin-top: 8px; color: #ef4444;">Delete</button>
          </div>
        `;
      }

      return `<p style="opacity: 0.5;">No selection</p>`;
    };

    const updateUI = () => {
      const menu = context.menuRoot;
      const currentParams = model.getParams();
      menu.innerHTML = `
        <div class="menu-section">
          <h3 class="section-title">Scene Editor</h3>

          <div style="background: rgba(0,0,0,0.04); padding: 10px; border-radius: 6px; margin-bottom: 16px; border: 1px solid rgba(0,0,0,0.08);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <span style="font-weight: 600; font-size: 0.8rem; color: #475569;">Environment</span>
            </div>
            <div style="display: flex; align-items: center; gap: 10px; font-size: 0.85rem; margin-bottom: 8px;">
              <span style="color: #64748b;">Gravity:</span>
              <input type="number" step="0.5" id="global-gravity"
                style="width: 70px; padding: 6px; border: 1px solid #cbd5e1; border-radius: 4px; font-family: inherit; font-size: 0.9rem;"
                value="${currentParams.gravity}">
              <span style="color: #94a3b8; font-size: 0.75rem;">m/s²</span>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 80px; gap: 8px; align-items: center; font-size: 0.85rem;">
              <label style="display: flex; align-items: center; gap: 6px; color: #64748b;"><input type="checkbox" id="snap-enabled" ${snapEnabled ? 'checked' : ''}> Grid Snap</label>
              <input type="number" step="0.05" min="0.05" id="snap-step" style="width: 100%; padding: 6px; border: 1px solid #cbd5e1; border-radius: 4px;" value="${snapStep}">
              <label style="display: flex; align-items: center; gap: 6px; color: #64748b;"><input type="checkbox" id="anchor-snap-enabled" ${anchorSnapEnabled ? 'checked' : ''}> Joint Anchor Snap</label>
              <span></span>
              <label style="display: flex; align-items: center; gap: 6px; color: #64748b;"><input type="checkbox" id="angle-snap-enabled" ${angleSnapEnabled ? 'checked' : ''}> Angle Snap</label>
              <input type="number" step="1" min="1" id="angle-snap-step" style="width: 100%; padding: 6px; border: 1px solid #cbd5e1; border-radius: 4px;" value="${angleSnapStepDeg}">
            </div>
            <div style="margin-top: 10px; display: flex; align-items: center; gap: 10px; font-size: 0.85rem; border-top: 1px solid rgba(0,0,0,0.05); padding-top: 8px;">
               <span style="color: #64748b;">Sub-steps:</span>
               <select id="sub-steps-select" style="padding: 4px; border-radius: 4px; border: 1px solid #cbd5e1;">
                  <option value="1" ${currentParams.subSteps === 1 ? 'selected' : ''}>1x</option>
                  <option value="2" ${currentParams.subSteps === 2 ? 'selected' : ''}>2x</option>
                  <option value="4" ${currentParams.subSteps === 4 ? 'selected' : ''}>4x</option>
                  <option value="8" ${currentParams.subSteps === 8 ? 'selected' : ''}>8x</option>
               </select>
               <span style="color: #94a3b8; font-size: 0.75rem;">(Stability+)</span>
            </div>
          </div>
            <div style="margin-top: 10px; display: flex; align-items: center; gap: 10px; font-size: 0.85rem; border-top: 1px solid rgba(0,0,0,0.05); padding-top: 8px;">
               <span style="color: #64748b;">Sub-steps:</span>
               <select id="sub-steps-select" style="padding: 4px; border-radius: 4px; border: 1px solid #cbd5e1;">
                  <option value="1" ${currentParams.subSteps === 1 ? 'selected' : ''}>1x</option>
                  <option value="2" ${currentParams.subSteps === 2 ? 'selected' : ''}>2x</option>
                  <option value="4" ${currentParams.subSteps === 4 ? 'selected' : ''}>4x</option>
                  <option value="8" ${currentParams.subSteps === 8 ? 'selected' : ''}>8x</option>
               </select>
               <span style="color: #94a3b8; font-size: 0.75rem;">(Stability+)</span>
            </div>
          </div>

          <div class="controls" style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
            <button id="add-circle" class="game-btn active">+ Circle</button>
            <button id="add-box" class="game-btn active">+ Box</button>
            <button id="mode-rev" class="game-btn ${jointMode === 'revolute' ? 'active' : 'secondary'}">Revolute</button>
            <button id="mode-prism" class="game-btn ${jointMode === 'prismatic' ? 'active' : 'secondary'}">Prismatic</button>
            <button id="mode-weld" class="game-btn ${jointMode === 'weld' ? 'active' : 'secondary'}">Weld</button>
            <button id="export-json" class="game-btn secondary">Export</button>
            <button id="import-json" class="game-btn secondary">Import</button>
            <button id="clear-scene" class="game-btn secondary">Clear Scene</button>
          </div>
          ${uiNotice ? `<div style="margin-top:8px; font-size:0.8rem; color:#0369a1;">${uiNotice}</div>` : ''}
        </div>
        <div id="props-panel" class="menu-section" style="border-top: 1px solid #e2e8f0; margin-top: 12px; padding-top: 12px;">
          ${renderPropsPanel()}
        </div>
        <div class="help-text">
          ${jointMode
            ? (pendingBodyA
              ? 'Joint mode: move pointer and click second body.'
              : 'Joint mode: click first body to set anchor.')
            : 'Mode: Shift+Click multi-select, drag empty space for box-select, Esc clears selection.'}
        </div>
      `;

      const subStepsSelect = menu.querySelector('#sub-steps-select') as HTMLSelectElement;
      subStepsSelect?.addEventListener('change', (e: any) => {
        model.setParam('subSteps', parseInt(e.target.value) || 1);
        queueSaveScene();
        uiNotice = `Sub-stepping: ${e.target.value}x`;
        updateUI();
      });

      const gravInput = menu.querySelector('#global-gravity') as HTMLInputElement;
      gravInput?.addEventListener('input', (e: any) => {
        model.setParam('gravity', clampFinite(e.target.value, model.getParams().gravity));
        queueSaveScene();
      });

      const snapEnabledInput = menu.querySelector('#snap-enabled') as HTMLInputElement;
      snapEnabledInput?.addEventListener('change', (e: any) => {
        snapEnabled = !!e.target.checked;
      });

      const snapStepInput = menu.querySelector('#snap-step') as HTMLInputElement;
      snapStepInput?.addEventListener('change', (e: any) => {
        const v = clampFinite(e.target.value, 0.1);
        snapStep = v >= 0.05 ? v : 0.1;
        updateUI();
      });

      const anchorSnapInput = menu.querySelector('#anchor-snap-enabled') as HTMLInputElement;
      anchorSnapInput?.addEventListener('change', (e: any) => {
        anchorSnapEnabled = !!e.target.checked;
      });

      const angleSnapInput = menu.querySelector('#angle-snap-enabled') as HTMLInputElement;
      angleSnapInput?.addEventListener('change', (e: any) => {
        angleSnapEnabled = !!e.target.checked;
      });

      const angleSnapStepInput = menu.querySelector('#angle-snap-step') as HTMLInputElement;
      angleSnapStepInput?.addEventListener('change', (e: any) => {
        const v = clampFinite(e.target.value, 15);
        angleSnapStepDeg = v >= 1 ? v : 15;
        updateUI();
      });

      menu.querySelector('#add-circle')?.addEventListener('click', () => {
        model.addCircle(0, -1.0, 0.15);
        refreshCaches();
        queueSaveScene();
        requestRedraw();
      });

      menu.querySelector('#add-box')?.addEventListener('click', () => {
        model.addBox(0, -1.0, 0.3, 0.2);
        refreshCaches();
        queueSaveScene();
        requestRedraw();
      });

      menu.querySelector('#mode-rev')?.addEventListener('click', () => {
        jointMode = jointMode === 'revolute' ? null : 'revolute';
        pendingBodyA = null;
        pendingAnchorWorld = null;
        updateUI();
        requestRedraw();
      });

      menu.querySelector('#mode-prism')?.addEventListener('click', () => {
        jointMode = jointMode === 'prismatic' ? null : 'prismatic';
        pendingBodyA = null;
        pendingAnchorWorld = null;
        updateUI();
        requestRedraw();
      });

      menu.querySelector('#mode-weld')?.addEventListener('click', () => {
        jointMode = jointMode === 'weld' ? null : 'weld';
        pendingBodyA = null;
        pendingAnchorWorld = null;
        updateUI();
        requestRedraw();
      });

      menu.querySelector('#clear-scene')?.addEventListener('click', () => {
        model.reset();
        refreshCaches();
        clearSelection();
        pendingBodyA = null;
        pendingAnchorWorld = null;
        uiNotice = 'Scene cleared.';
        queueSaveScene();
        requestRedraw();
        updateUI();
      });

      menu.querySelector('#export-json')?.addEventListener('click', () => {
        const blob = new Blob([model.serialize()], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'scene.json';
        a.click();
        URL.revokeObjectURL(url);
      });

      menu.querySelector('#import-json')?.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e: any) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = (re) => {
            const text = re.target?.result;
            if (!text || typeof text !== 'string') return;
            const check = validateImportText(text);
            if (!check.ok) {
              uiNotice = `Import failed: ${check.reason}`;
              updateUI();
              return;
            }
            model.deserialize(JSON.stringify(check.data));
            refreshCaches();
            clearSelection();
            pendingBodyA = null;
            pendingAnchorWorld = null;
            uiNotice = 'Import success.';
            queueSaveScene();
            requestRedraw();
            updateUI();
          };
          reader.readAsText(file);
        };
        input.click();
      });

      menu.querySelectorAll('.joint-preset').forEach(btn => {
        btn.addEventListener('click', (e: any) => {
          const preset = e.target.dataset.preset as 'soft' | 'normal' | 'strong' | undefined;
          if (!preset) return;
          applyJointPreset(preset);
          updateUI();
        });
      });

      menu.querySelectorAll('.prop-input').forEach(input => {
        input.addEventListener('change', (e: any) => {
          const key = e.target.dataset.key;
          if (!key) return;
          const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
          applySelectionProperty(key, val);
          queueSaveScene();
          requestRedraw();
          updateUI();
        });
      });

      menu.querySelector('#del-obj')?.addEventListener('click', () => {
        removeSelected();
        queueSaveScene();
        requestRedraw();
        updateUI();
      });
    };

    loadScene();
    updateUI();

    const runner = new SimulationRunner(model, redrawNow);

    const onPointerDown = (e: PointerEvent) => {
      const worldRaw = toWorldFromEvent(e);
      pointerWorld = worldRaw;
      const hitBody = getBodyAtPoint(worldRaw.x, worldRaw.y);
      const hitJoint = getJointAtPoint(worldRaw.x, worldRaw.y);

      if (jointMode && hitBody) {
        const snapped = snapAnchor(worldRaw);
        if (!pendingBodyA) {
          pendingBodyA = hitBody.id;
          pendingAnchorWorld = snapped;
          setSingleSelection(hitBody.id);
        } else if (pendingBodyA !== hitBody.id && pendingAnchorWorld) {
          if (jointMode === 'revolute') {
            model.addRevoluteJoint(pendingBodyA, hitBody.id, pendingAnchorWorld);
          } else if (jointMode === 'weld') {
            model.addWeldJoint(pendingBodyA, hitBody.id, pendingAnchorWorld);
          } else {
            const axis = snappedAxis(pendingAnchorWorld, snapped);
            model.addPrismaticJoint(pendingBodyA, hitBody.id, pendingAnchorWorld, axis);
          }
          refreshCaches();
          pendingBodyA = null;
          pendingAnchorWorld = null;
          jointMode = null;
          queueSaveScene();
        }
        requestRedraw();
        updateUI();
        return;
      }

      if (hitBody) {
        const bodySelected = selectedIds.has(hitBody.id);
        const multipleBodySelected = selectedBodyIds().length > 1;

        if (e.shiftKey) {
          toggleSelection(hitBody.id);
          requestRedraw();
          updateUI();
          return;
        }

        if (!(bodySelected && multipleBodySelected)) {
          setSingleSelection(hitBody.id);
        } else {
          primarySelectedId = hitBody.id;
          selectedIds = new Set(selectedBodyIds());
        }

        if (e.pointerType === 'touch') {
          // For touch input, defer drag until movement passes threshold.
          pendingTouchDragBodyId = hitBody.id;
          pendingTouchDragPointerId = e.pointerId;
          pendingTouchDragStartWorld = worldRaw;
          isDragging = false;
          draggingPointerId = null;
          dragOriginWorld = null;
        } else {
          pendingTouchDragBodyId = null;
          pendingTouchDragPointerId = null;
          pendingTouchDragStartWorld = null;
          startGroupDrag(worldRaw, e.pointerId);
        }

        isBoxSelecting = false;
        context.onSfx('click', 0.5);
      } else if (hitJoint) {
        if (e.shiftKey) toggleSelection(hitJoint.id);
        else setSingleSelection(hitJoint.id);
      } else {
        isDragging = false;
        dragOriginWorld = null;
        isBoxSelecting = true;
        selectionBoxStart = worldRaw;
        selectionBoxCurrent = worldRaw;
        boxSelectionAdditive = !!e.shiftKey;
        if (!boxSelectionAdditive) clearSelection();
      }

      requestRedraw();
      updateUI();
    };

    const onPointerMove = (e: PointerEvent) => {
      const worldRaw = toWorldFromEvent(e);
      pointerWorld = worldRaw;

      if (
        pendingTouchDragBodyId &&
        pendingTouchDragPointerId === e.pointerId &&
        pendingTouchDragStartWorld &&
        !isDragging
      ) {
        const d = Math.hypot(
          worldRaw.x - pendingTouchDragStartWorld.x,
          worldRaw.y - pendingTouchDragStartWorld.y
        );
        if (d >= TOUCH_DRAG_THRESHOLD) {
          startGroupDrag(pendingTouchDragStartWorld, e.pointerId);
          pendingTouchDragBodyId = null;
          pendingTouchDragPointerId = null;
          pendingTouchDragStartWorld = null;
        }
      }

      if (isDragging && dragOriginWorld && (draggingPointerId === null || draggingPointerId === e.pointerId)) {
        const dx = worldRaw.x - dragOriginWorld.x;
        const dy = worldRaw.y - dragOriginWorld.y;
        for (const [id, start] of dragStartPositions.entries()) {
          const body = cachedBodies.find(b => b.id === id);
          if (!body) continue;
          body.x = snapValue(start.x + dx);
          body.y = snapValue(start.y + dy);
          body.vx = 0;
          body.vy = 0;
        }
      }

      if (isBoxSelecting && selectionBoxStart) {
        selectionBoxCurrent = worldRaw;
        applySelectionBox();
      }

      if (jointMode || isDragging || isBoxSelecting) requestRedraw();
    };

    const onPointerUp = (e: PointerEvent) => {
      if (isDragging && (draggingPointerId === null || draggingPointerId === e.pointerId)) queueSaveScene();
      if (isBoxSelecting) applySelectionBox();

      isDragging = false;
      draggingPointerId = null;
      dragOriginWorld = null;
      dragStartPositions.clear();
      pendingTouchDragBodyId = null;
      pendingTouchDragPointerId = null;
      pendingTouchDragStartWorld = null;

      isBoxSelecting = false;
      selectionBoxStart = null;
      selectionBoxCurrent = null;

      requestRedraw();
      updateUI();
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      jointMode = null;
      pendingBodyA = null;
      pendingAnchorWorld = null;
      pointerWorld = null;
      isDragging = false;
      draggingPointerId = null;
      isBoxSelecting = false;
      selectionBoxStart = null;
      selectionBoxCurrent = null;
      pendingTouchDragBodyId = null;
      pendingTouchDragPointerId = null;
      pendingTouchDragStartWorld = null;
      clearSelection();
      uiNotice = 'Selection cleared.';
      requestRedraw();
      updateUI();
    };

    context.canvas.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('keydown', onKeyDown);

    requestRedraw();

    return {
      play: () => runner.start(),
      pause: () => {
        runner.stop();
        flushSaveScene();
      },
      isRunning: () => runner.isRunning(),
      reset: () => {
        model.reset();
        refreshCaches();
        clearSelection();
        pendingBodyA = null;
        pendingAnchorWorld = null;
        pointerWorld = null;
        isDragging = false;
        draggingPointerId = null;
        pendingTouchDragBodyId = null;
        pendingTouchDragPointerId = null;
        pendingTouchDragStartWorld = null;
        isBoxSelecting = false;
        selectionBoxStart = null;
        selectionBoxCurrent = null;
        uiNotice = 'Scene reset.';
        flushSaveScene();
        requestRedraw();
        updateUI();
      },
      step: (n: number) => runner.step(n),
      destroy: () => {
        runner.stop();
        flushSaveScene();
        context.canvas.removeEventListener('pointerdown', onPointerDown);
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
        window.removeEventListener('keydown', onKeyDown);
        context.menuRoot.innerHTML = '';
      },
      onResize: () => requestRedraw(),
    };
  }
};
