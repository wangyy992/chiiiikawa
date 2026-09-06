/* 全局可调参数：想改手感只动这里 */
window.CFG = {
  W: 960,
  H: 540,

  GROUND_Y: 440,          // 地面顶部（世界坐标 y）
  SEA_Y: 470,             // 飞行区海平面
  PLAYER_HOME_X: 250,     // 角色默认屏幕 x
  PLAYER_W: 34,
  PLAYER_H: 44,

  // —— 地面状态（RUN）物理 ——
  GRAVITY: 2500,          // px/s^2
  JUMP_V: -820,           // 起跳初速度
  JUMP_CUT: 0.42,         // 松开跳跃键时的削减系数（可变跳跃高度）
  MAX_JUMPS: 2,           // 二段跳
  COYOTE: 0.10,           // 土狼时间（离地后仍可起跳）
  JUMP_BUFFER: 0.12,      // 落地前预输入缓冲
  MAX_FALL: 1300,

  // —— 飞行状态（FLY）物理：重力关闭，二维自由移动 ——
  FLY_ACCEL: 2600,
  FLY_MAX_V: 430,
  FLY_DRAG: 6.5,          // 松手后的阻尼
  FLY_BOB: 26,            // 无输入时的漂浮幅度
  FLY_MIN_X: 130,
  FLY_MAX_X: 620,
  FLY_MIN_Y: 70,
  FLY_MAX_Y: 470,
  ITEM_FLY_TIME: 10,      // 吉他道具腾空时长（秒）

  // —— 速度与难度 ——
  BASE_SPEED: 330,
  MAX_SPEED: 620,
  SPEED_PER_M: 0.11,      // 每米增加的速度

  // —— 讨伐怪追击 ——
  LEAD_START: 200,        // 初始领先距离（px）
  LEAD_MAX: 235,
  LEAD_REGEN: 13,         // px/s 自然拉开
  LEAD_HIT: 80,           // 撞一次被拉近多少
  HIT_INVULN: 1.3,        // 受伤后的短暂无敌

  // —— 关卡生成 ——
  SPAWN_AHEAD: 1400,      // 相机前方生成距离
  GROUND_REGION: [1900, 3200],
  SKY_REGION: [1500, 2400],
  SKY_CHANCE_START: 0.18, // 一段地面后进入飞行区的概率（随距离上升）
  SKY_CHANCE_MAX: 0.55,
  LANDING_RUNWAY: 420,    // 飞行区结束后的安全落地跑道

  COIN: 24,               // 硬币直径
  CERT_STEP: 800,         // 每多少米推进一次“除草证”进度
};
