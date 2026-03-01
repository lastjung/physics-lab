export interface SimulationPreset {
  id: string;
  name: string;
  pluginId:
    | 'pendulum'
    | 'spring-mass'
    | 'double-pendulum'
    | 'double-pendulum-engine'
    | 'driven-pendulum'
    | 'coupled-spring'
    | 'orbit'
    | 'collision-lab'
    | 'billiards'
    | 'car-suspension'
    | 'newtons-cradle'
    | 'cart-pendulum'
    | 'cart-pendulum-engine'
    | 'roller-coaster'
    | 'roller-coaster-spring'
    | 'roller-coaster-flight'
    | 'roller-coaster-two-balls'
    | 'polygon-shapes'
    | 'colliding-blocks'
    | 'pile-attract'
    | 'hanging-chain'
    | 'double-pendulum-compare'
    | 'revolute-demo'
    | 'wheel-joint-demo'
    | 'curved-object'
    | 'rigid-roller-coaster'
    | 'string'
    | 'pendulum-clock'
    | 'rigid-double-pendulum'
    | 'scene-editor';
  category: 'Oscillation' | 'Mechanics';
  summary: string;
  help: string;
  params: Record<string, number>;
}

export const simulationPresets: SimulationPreset[] = [
  {
    id: 'damped-pendulum',
    name: 'Damped Pendulum',
    pluginId: 'pendulum',
    category: 'Oscillation',
    summary: 'Dissipative pendulum with friction-like damping.',
    help:
      '진자 길이/중력/감쇠를 조절해 감쇠 진동을 확인합니다.\n초기 각도(또는 드래그 위치)가 클수록 큰 진폭으로 시작합니다.\nDamping을 높이면 에너지가 빠르게 줄어듭니다.',
    params: {
      damping: 0.12,
    },
  },
  {
    id: 'ideal-pendulum',
    name: 'Ideal Pendulum',
    pluginId: 'pendulum',
    category: 'Oscillation',
    summary: 'Frictionless pendulum for baseline period/energy behavior.',
    help:
      '이상 진자(마찰 거의 없음) 동작을 관찰합니다.\n감쇠를 0에 가깝게 두고 주기/에너지 보존 경향을 비교하기 좋습니다.\n작은 각도에서는 주기가 거의 일정합니다.',
    params: {
      damping: 0,
    },
  },
  {
    id: 'spring-mass',
    name: 'Spring Mass',
    pluginId: 'spring-mass',
    category: 'Mechanics',
    summary: 'Single-axis spring oscillator with tunable stiffness.',
    help:
      '1자유도 스프링-질량 진동입니다.\n스프링 상수(k)를 높이면 주기가 짧아지고, 질량(m)을 높이면 주기가 길어집니다.\n블록을 드래그해 초기 변위를 직접 줄 수 있습니다.',
    params: {},
  },
  {
    id: 'double-pendulum',
    name: 'Double Pendulum',
    pluginId: 'double-pendulum',
    category: 'Oscillation',
    summary: 'Chaotic coupled pendulum dynamics with two links.',
    help:
      '이중 진자의 카오스 특성을 보는 실험입니다.\n초기 각도/감쇠를 조금만 바꿔도 장기 궤적이 크게 달라질 수 있습니다.\n질량/길이 비율 조절로 모드 변화를 확인해보세요.',
    params: {
      damping: 0.02,
    },
  },
  {
    id: 'double-pendulum-engine',
    name: 'Double Pendulum (Engine)',
    pluginId: 'double-pendulum-engine',
    category: 'Oscillation',
    summary: 'Constraint-based double pendulum using Engine2D joints.',
    help:
      'Distance Joint 기반 엔진 이중진자입니다.\n길이 제약 오차(lenErr)를 보며 iteration 안정성을 비교할 수 있습니다.\n기존 ODE 버전과 동작 차이를 비교하기 좋습니다.',
    params: {
      length1: 1.05,
      length2: 0.95,
      mass1: 1.0,
      mass2: 1.0,
      damping: 0.04,
      iterations: 12,
      initialTheta1: 1.1,
      initialTheta2: 0.8,
    },
  },
  {
    id: 'driven-pendulum',
    name: 'Driven Pendulum',
    pluginId: 'driven-pendulum',
    category: 'Oscillation',
    summary: 'Pendulum with periodic external forcing and tunable damping.',
    help:
      '외력이 걸린 진자입니다.\nDrive Amplitude/Frequency로 공진 구간을 찾을 수 있습니다.\n감쇠와 외력의 균형에 따라 안정/복잡 진동 패턴이 나타납니다.',
    params: {
      damping: 0.08,
      driveAmplitude: 0.9,
      driveFrequency: 1.8,
    },
  },
  {
    id: 'coupled-spring',
    name: 'Coupled Spring',
    pluginId: 'coupled-spring',
    category: 'Mechanics',
    summary: 'Two masses coupled by springs exchanging energy over time.',
    help:
      '두 질량 사이 에너지 교환(비팅)을 관찰하는 모델입니다.\n질량/스프링 상수 비를 바꾸면 에너지 전달 속도와 모드가 달라집니다.\n양쪽 질량을 드래그해 초기 상태를 직접 만질 수 있습니다.',
    params: {
      damping: 0.25,
    },
  },
  {
    id: 'orbit',
    name: 'Orbit',
    pluginId: 'orbit',
    category: 'Mechanics',
    summary: '2D central-force orbit with adjustable gravity and damping.',
    help:
      '중심력 궤도(공전) 시뮬레이션입니다.\n초기 반지름과 초기 속도를 조절해 타원/원/탈출형 궤도를 비교할 수 있습니다.\nDamping을 올리면 점차 나선형으로 감쇠합니다.',
    params: {
      damping: 0.003,
      mu: 9.5,
    },
  },
  {
    id: 'collision-lab',
    name: 'Collision Lab',
    pluginId: 'collision-lab',
    category: 'Mechanics',
    summary: 'Two-body collisions with wall bounce and adjustable restitution.',
    help:
      '2개 공의 충돌/반사 실험입니다.\n질량, 공-공 반발, 벽 반발, 공기 감쇠를 조절할 수 있습니다.\n초기 속도(Vx/Vy) 설정으로 다양한 충돌 시나리오를 만듭니다.',
    params: {
      restitution: 0.98,
      wallRestitution: 0.97,
      linearDamping: 0.002,
      initialVx1: 1.5,
      initialVy1: -0.4,
      initialVx2: -1.2,
      initialVy2: 0.25,
    },
  },
  {
    id: 'newtons-cradle',
    name: "Newton's Cradle",
    pluginId: 'newtons-cradle',
    category: 'Mechanics',
    summary: 'Five coupled impact balls exchanging momentum in sequence.',
    help:
      "뉴턴스 크래들(5구) 모멘텀 전달 실험입니다.\nStiffness는 복원력, Damping은 손실, Restitution은 충돌 탄성을 의미합니다.\n추천: Stiffness 18 / Damping 0.006 / Restitution 0.998 / Initial X1 -0.58 / Initial X5 0.\n한쪽 끝 공만 당겨 시작하면 연쇄 전달이 가장 선명합니다.",
    params: {
      stiffness: 18,
      damping: 0.006,
      restitution: 0.998,
      spacing: 0.241,
      initialX1: -0.58,
      initialX5: 0,
    },
  },
  {
    id: 'cart-pendulum',
    name: 'Cart + Pendulum',
    pluginId: 'cart-pendulum',
    category: 'Mechanics',
    summary: 'Coupled nonlinear cart-pole dynamics with optional external drive.',
    help:
      '카트-진자 결합 시스템입니다.\n카트 위치와 진자 각도가 서로 영향을 주며 비선형 동작을 만듭니다.\nDrive를 올리면 강제 진동/불안정 구간을 관찰하기 좋습니다.',
    params: {
      cartSpring: 1.8,
      driveAmplitude: 0.8,
      driveFrequency: 1.1,
      initialTheta: 0.45,
    },
  },
  {
    id: 'roller-coaster',
    name: 'Roller Coaster',
    pluginId: 'roller-coaster',
    category: 'Mechanics',
    summary: 'Single car constrained on a tunable track with gravity and damping.',
    help:
      '트랙 위 단일 카트 동역학입니다.\nTrack Amp/Freq/Tilt로 경로 형상을 바꾸고, Damping/Gravity로 감쇠와 가속을 조절합니다.\n카트를 드래그해 시작 지점을 바꿀 수 있습니다.',
    params: {
      trackAmplitude: 0.55,
      trackFrequency: 1.35,
      trackTilt: 0.05,
      boundaryMode: 0,
      damping: 0.04,
      initialX: -1.35,
    },
  },
  {
    id: 'roller-coaster-spring',
    name: 'Coaster + Spring',
    pluginId: 'roller-coaster-spring',
    category: 'Mechanics',
    summary: 'Track-constrained car attached to a spring anchor.',
    help:
      '카트가 트랙 위를 움직이면서 스프링 복원력도 함께 받는 모델입니다.\nSpring K와 Spring Rest X를 바꿔 공진/구속 효과를 비교하세요.\n카트를 드래그해 초기 위치를 바꿀 수 있습니다.',
    params: {
      trackAmplitude: 0.55,
      trackFrequency: 1.35,
      trackTilt: 0.05,
      damping: 0.035,
      springK: 10.0,
      springDamping: 0.3,
      springRestX: 0.0,
      initialX: -1.2,
    },
  },
  {
    id: 'roller-coaster-flight',
    name: 'Coaster + Flight',
    pluginId: 'roller-coaster-flight',
    category: 'Mechanics',
    summary: 'Car can detach from track and re-contact via ballistic flight.',
    help:
      '급한 곡률 구간에서 카트가 트랙을 이탈해 비행(포물선) 후 다시 접촉합니다.\nFlight Threshold로 이탈 민감도를 조절할 수 있습니다.\n고주파 트랙에서 Flight/Track 전환을 관찰해 보세요.',
    params: {
      trackAmplitude: 0.62,
      trackFrequency: 1.65,
      trackTilt: 0.03,
      damping: 0.035,
      flightThreshold: 0.0,
      initialX: -1.35,
    },
  },
  {
    id: 'roller-coaster-two-balls',
    name: 'Coaster Two Balls',
    pluginId: 'roller-coaster-two-balls',
    category: 'Mechanics',
    summary: 'Two balls moving on the same track with collisions.',
    help:
      '한 트랙 위에서 2개 공이 동시에 움직이며 서로 충돌합니다.\n트랙 파라미터와 충돌 탄성(Ball Restitution)을 조절해 에너지 전달 패턴을 확인할 수 있습니다.\n두 공 모두 드래그로 시작 위치를 조절할 수 있습니다.',
    params: {
      trackAmplitude: 0.55,
      trackFrequency: 1.35,
      trackTilt: 0.05,
      boundaryMode: 0,
      damping: 0.05,
      ballRestitution: 0.94,
      initialX1: -1.25,
      initialX2: 0.55,
    },
  },
  {
    id: 'colliding-blocks',
    name: 'Colliding Blocks',
    pluginId: 'colliding-blocks',
    category: 'Mechanics',
    summary: 'Multiple AABB blocks colliding in a bounded arena.',
    help:
      '여러 블록이 서로 충돌하고 벽에 반사되는 데모입니다.\nBlock/Wall restitution과 damping을 조절해 에너지 소산을 비교할 수 있습니다.\n블록을 드래그하거나 Shake 버튼으로 혼돈 상태를 만들 수 있습니다.',
    params: {
      gravity: 9.81,
      damping: 0.02,
      restitution: 0.6,
      wallRestitution: 0.35,
    },
  },
  {
    id: 'polygon-shapes',
    name: 'Polygon Shapes',
    pluginId: 'polygon-shapes',
    category: 'Mechanics',
    summary: 'SAT polygon collision demo with rotating convex shapes.',
    help:
      '삼각형/사각형/오각형의 SAT 충돌 데모입니다.\n중력/감쇠/마찰/반발을 조절하며 다각형 접촉 안정성을 확인할 수 있습니다.\nReset Stack으로 초기 상태를 재구성합니다.',
    params: {
      gravity: 9.81,
      damping: 0.02,
      angularDamping: 0.06,
      restitution: 0.58,
      wallRestitution: 0.42,
      friction: 0.32,
    },
  },
  {
    id: 'billiards',
    name: 'Billiards',
    pluginId: 'billiards',
    category: 'Mechanics',
    summary: 'Multi-ball table collisions with cue-like break start.',
    help:
      '당구대에서 다물체 충돌을 관찰하는 데모입니다.\nBall/Wall restitution과 damping, cue speed를 조절해 충돌 전달과 감쇠를 비교합니다.\n공을 드래그해 초기 배치를 바꿀 수 있습니다.',
    params: {
      restitution: 0.96,
      wallRestitution: 0.93,
      linearDamping: 0.01,
      cueSpeed: 3.2,
    },
  },
  {
    id: 'car-suspension',
    name: 'Car Suspension',
    pluginId: 'car-suspension',
    category: 'Mechanics',
    summary: 'Quarter-car suspension with spring-damper and road input.',
    help:
      '차체-휠 2질량 서스펜션 모델입니다.\n스프링/댐퍼/타이어 강성과 노면 진동 입력을 조절해 차체 응답과 진동 전달을 비교합니다.',
    params: {
      springK: 22,
      damperC: 1.2,
      tireK: 34,
      roadAmplitude: 0.08,
      roadFrequency: 1.4,
      gripOffsetX: 0,
      gripOffsetY: -22,
    },
  },
  {
    id: 'hanging-chain',
    name: 'Hanging Chain',
    pluginId: 'hanging-chain',
    category: 'Mechanics',
    summary: 'Multi-node chain linked by distance joints with gravity.',
    help:
      '거리가 고정된 여러 노드가 연결된 사슬 시뮬레이션입니다.\nDistance Joint 기능을 활용해 충돌과 제약 조건의 상호작용을 확인합니다.\n노드를 드래그하여 잡아당길 수 있으며, 바닥면과의 충돌도 지원합니다.',
    params: {
      segments: 12,
      linkLength: 0.15,
      gravity: 9.8,
      stiffness: 0.2,
    },
  },
  {
    id: 'pile-attract',
    name: 'Pile Attract',
    pluginId: 'pile-attract',
    category: 'Mechanics',
    summary: 'Dozens of particles attracted to a central point with collisions.',
    help:
      '중심 attractor로 끌려오는 수십 개의 유색 파티클을 관찰합니다.\n파티클 간의 충돌과 감쇠를 통해 더미(Pile)를 형성하는 과정을 볼 수 있습니다.\n마우스/터치로 attractor의 위치를 이동시켜 파티클들을 유도할 수 있습니다.\n공전처럼 돌리고 싶다면: Damping을 낮추고(0에 가깝게), 파티클을 중심에서 떨어뜨린 뒤 반지름 방향이 아닌 옆 방향(접선) 속도를 주면 원/타원 궤도에 가깝게 움직입니다.',
    params: {
      particleCount: 80,
      attractStrength: 1.8,
      damping: 0.12,
      restitution: 0.4,
    },
  },
  {
    id: 'chaos-compare',
    name: 'Chaos: Double Pendulum',
    pluginId: 'double-pendulum-compare',
    category: 'Oscillation',
    summary: 'Two double pendulums with tiny initial difference to visualize chaos.',
    help:
      '거의 동일한 초기 조건(ε 차이)을 가진 두 개의 이중 진자를 동시에 실행하여 카오스 이론의 비선형성을 관찰합니다.\n시간이 지남에 따라 두 상태의 거리(Phase Distance)가 지수적으로 증가하는 것을 확인할 수 있습니다.\nLyapunov 지수 근사치를 통해 시스템의 민감도를 수치화합니다.',
    params: {
      l1: 1.0,
      l2: 0.8,
      epsilon: 1e-4,
      damping: 0.01,
      initialTheta1: 2.1,
    },
  },
  {
    id: 'revolute-demo',
    name: 'Revolute Joint Demo',
    pluginId: 'revolute-demo',
    category: 'Mechanics',
    summary: 'Demonstration of joint motors and angular limits on a rotating arm.',
    help: 'Revolute Joint의 Motor와 Limit 기능을 테스트하는 데모입니다.\nMotor Speed와 Max Torque를 조절해 팔을 회전시키고,\nLimit을 활성화해 지정된 각도 범위 내에서만 움직이도록 제한할 수 있습니다.',
    params: {
      motorSpeed: 2.0,
      maxMotorTorque: 50.0,
      limitEnabled: 0,
      lowerAngle: -0.7853981633974483,
      upperAngle: 0.7853981633974483
    },
  },
  {
    id: 'scene-editor',
    pluginId: 'scene-editor',
    name: 'Scene Editor (Phase 4)',
    category: 'Mechanics',
    summary: 'Build and edit physics scenes dynamicly.',
    help: 'Drop objects and create joints in real-time. (Scaffold version)',
    params: {
      gravity: 9.8,
    },
  },
  {
    id: 'wheel-joint-demo',
    name: 'Wheel Joint Demo (Car)',
    pluginId: 'wheel-joint-demo',
    category: 'Mechanics',
    summary: 'Demonstration of wheel joints with suspension and motor.',
    help: '두 개의 Wheel Joint가 적용된 간이 자동차 데모입니다.\nStiffness와 Damping으로 서스펜션 질감을 조절하고,\nMotor Speed로 속도를 제어할 수 있습니다.',
    params: {
      stiffness: 100,
      damping: 15,
      motorSpeed: 5.0,
      maxMotorTorque: 50,
      gravity: 9.8,
      subSteps: 2
    },
  },
  {
    id: 'curved-object-demo',
    name: 'Curved Objects',
    pluginId: 'curved-object',
    category: 'Mechanics',
    summary: 'Collision detection on curved surfaces approximated by polylines.',
    help: '곡선(Polyline)으로 근사된 지면과의 충돌 데모입니다.\n곡선의 굴곡에 따라 공들이 어떻게 튀는지 관찰하세요.',
    params: {
        gravity: 9.8,
        restitution: 0.5,
        subSteps: 2
    },
  },
  {
    id: 'rigid-roller-coaster-demo',
    name: 'Rigid Roller Coaster',
    pluginId: 'rigid-roller-coaster',
    category: 'Mechanics',
    summary: 'Rigid body cart interacting with a polyline track.',
    help: '점질량이 아닌 강체(Rectangle)가 트랙 위를 주행하는 데모입니다.\n카트가 트랙의 곡률에 맞춰 회전하며 이동하는 것을 확인할 수 있습니다.',
    params: {
        gravity: 9.8,
        subSteps: 10
    },
  },
  {
    id: 'string-demo',
    name: 'String Simulation',
    pluginId: 'string',
    category: 'Mechanics',
    summary: 'Particle-constraint based flexible string model.',
    help: '여러 개의 질점과 Distance Joint로 구성된 실(String) 시뮬레이션입니다.\n장력이 어떻게 전달되는지, 그리고 물체와 어떻게 상호작용하는지 확인하세요.',
    params: {
        gravity: 9.8,
        frequency: 60,
        segments: 15,
        subSteps: 8
    },
  },
  {
    id: 'pendulum-clock-demo',
    name: 'Pendulum Clock (Escapement)',
    pluginId: 'pendulum-clock',
    category: 'Mechanics',
    summary: 'Functional clock escapement mechanism with gear and latch.',
    help: '톱니바퀴와 팰릿(Latch)이 맞물려 일정한 주기를 만드는 시계 탈진기 데모입니다.\n진자의 스윙이 톱니바퀴의 회전을 제어하는 과정을 관찰하세요.',
    params: {
        gravity: 9.8,
        gearTorque: 15.0,
        motorSpeed: 0.15,
        subSteps: 12
    },
  },
  {
    id: 'rigid-double-pendulum-demo',
    name: 'Rigid Double Pendulum',
    pluginId: 'rigid-double-pendulum',
    category: 'Oscillation',
    summary: 'Double pendulum with rigid bars instead of point masses.',
    help: '바(Bar) 형태의 강체로 구성된 이중 진자입니다.\n질량 분포와 회전 관성이 반영되어 기존 점질량 모델과 다른 카오스 거동을 보입니다.',
    params: {
        gravity: 9.8,
        l1: 2.0,
        l2: 2.0,
        m1: 1.0,
        m2: 1.0,
        subSteps: 10,
        damping: 0.02
    },
  },
];

export const getPresetById = (id: string | null): SimulationPreset => {
  if (!id) return simulationPresets[0];
  return simulationPresets.find((preset) => preset.id === id) ?? simulationPresets[0];
};
