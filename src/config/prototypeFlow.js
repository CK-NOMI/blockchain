export const SAMPLE_BATCH_ID = 'SC20240521001'

const bySlug = {
  p01_pc: {
    actions: [
      { label: '登录农户', to: '/farmer/dashboard' },
      { label: '登录管理员', to: '/admin/dashboard' },
      { label: '登录加工方', to: '/processor/dashboard' },
      { label: '登录物流方', to: '/logistics/dashboard' },
      { label: '登录零售方', to: '/retail/dashboard' },
      { label: '登录监管方', to: '/regulator/dashboard' },
      { label: '注册', to: '/register' },
      { label: '消费者溯源', to: '/trace/search' },
      { label: '退出确认', to: '/public/logout' },
      { label: '退出确认V2', to: '/public/logout-alt' },
      { label: '403演示', to: '/common/403' },
      { label: '404演示', to: '/common/404' },
    ],
    clickMap: [
      { keywords: ['login admin', 'admin login', 'platform admin', '管理员登录', '平台管理员'], to: '/admin/dashboard' },
      { keywords: ['login processor', 'processor login', '加工方登录', '加工企业登录'], to: '/processor/dashboard' },
      { keywords: ['login logistics', 'logistics login', 'login logistic', 'logistic login', 'logistic', 'logistics', '物流', '物流登录', '物流方登录'], to: '/logistics/dashboard' },
      { keywords: ['login retail', 'retail login', '零售方登录', '超市登录'], to: '/retail/dashboard' },
      { keywords: ['login regulator', 'regulator login', '监管方登录', '监管登录'], to: '/regulator/dashboard' },
      { keywords: ['login farmer', 'farmer login', '农户登录'], to: '/farmer/dashboard' },
      { keywords: ['register', 'signup', '注册', '申请'], to: '/register' },
      { keywords: ['trace', 'consumer', 'query', '查询', '扫码', '消费者查询', '消费者溯源'], to: '/trace/search' },
      { keywords: ['logout', 'log out', '退出'], to: '/public/logout' },
      { keywords: ['logout v2', 'logout alt'], to: '/public/logout-alt' },
      { keywords: ['403', 'forbidden', '无权限'], to: '/common/403' },
      { keywords: ['404', 'not found'], to: '/common/404' },
      { keywords: ['login', 'signin', '登录'], to: '/farmer/dashboard' },
    ],
  },
  p02_pc: {
    actions: [
      { label: '提交注册申请', to: '/public/pending' },
      { label: '返回登录', to: '/login' },
    ],
    clickMap: [
      { keywords: ['submit', '\u63d0\u4ea4', '\u6ce8\u518c\u7533\u8bf7', 'register'], to: '/public/pending' },
      { keywords: ['login', '返回'], to: '/login' },
    ],
  },
  p03_pc: {
    actions: [{ label: '返回登录', to: '/login' }],
    clickMap: [{ keywords: ['login', '返回'], to: '/login' }],
  },
  p04_pc: {
    actions: [
      { label: '去登录', to: '/login' },
      { label: '进入工作台', to: '/farmer/dashboard' },
      { label: '跳转404', to: '/common/404' },
    ],
    clickMap: [
      { keywords: ['re-login', 'relogin', 'login', '登录'], to: '/login' },
      { keywords: ['dashboard', 'workbench', '工作台'], to: '/farmer/dashboard' },
      { keywords: ['404', 'not found'], to: '/common/404' },
    ],
  },
  p05_404_pc: {
    actions: [
      { label: '去登录', to: '/login' },
      { label: '跳转403', to: '/common/403' },
    ],
    clickMap: [
      { keywords: ['homepage', 'home', '首页'], to: '/login' },
      { keywords: ['support', 'contact'], to: '/login' },
      { keywords: ['403', 'forbidden'], to: '/common/403' },
    ],
  },
  p06_pc_1: {
    actions: [
      { label: '确认退出', to: '/login' },
      { label: '取消', to: '/farmer/dashboard' },
      { label: '打开退出页变体', to: '/public/logout-alt' },
    ],
    clickMap: [
      { keywords: ['confirm', 'logout', 'log out', 'exit'], to: '/login' },
      { keywords: ['cancel', 'return', 'dashboard'], to: '/farmer/dashboard' },
      { keywords: ['variant', 'logout variant'], to: '/public/logout-alt' },
    ],
  },
  p06_pc_2: {
    actions: [
      { label: '确认退出', to: '/login' },
      { label: '取消', to: '/farmer/dashboard' },
      { label: '返回退出页V1', to: '/public/logout' },
    ],
    clickMap: [
      { keywords: ['yes', 'logout', 'log out', 'confirm', 'exit'], to: '/login' },
      { keywords: ['no', 'stay', 'cancel'], to: '/farmer/dashboard' },
      { keywords: ['v1', 'back to logout'], to: '/public/logout' },
    ],
  },

  f01_pc: {
    actions: [{ label: '新建批次', to: '/farmer/batch-create' }],
    clickMap: [
      { keywords: ['create new batch', 'new batch', '生成 batchid'], to: '/farmer/batch-create' },
      { keywords: ['entry records', 'entry', 'record'], to: '/farmer/records/:batchId' },
      { keywords: ['view all', 'my batches'], to: '/farmer/batches' },
    ],
  },
  f02_pc: {
    actions: [{ label: '提交', to: '/farmer/records/:batchId' }],
    clickMap: [
      { keywords: ['submit', 'continue', '下一步'], to: '/farmer/records/:batchId' },
      { keywords: ['save', 'draft'], to: '/farmer/batch-create' },
    ],
  },
  f03_pc: {
    actions: [{ label: '提交上链', to: '/farmer/batches' }],
    clickMap: [
      { keywords: ['submit to chain', 'save submit', '提交上链'], to: '/farmer/batches' },
      { keywords: ['add entry', 'add'], to: '/farmer/records/:batchId' },
    ],
  },
  f04_pc: {
    actions: [{ label: '查看批次详情', to: '/farmer/batch-detail/:batchId' }],
    clickMap: [
      { keywords: ['view detail', 'detail'], to: '/farmer/batch-detail/:batchId' },
      { keywords: ['continue entry', 'entry'], to: '/farmer/records/:batchId' },
      { keywords: ['create new batch', 'new batch'], to: '/farmer/batch-create' },
    ],
  },
  f05_pc: {
    actions: [
      { label: '返回批次列表', to: '/farmer/batches' },
      { label: '流转到加工方', to: '/processor/dashboard' },
    ],
    clickMap: [
      { keywords: ['back to traceability list', 'back list', 'back'], to: '/farmer/batches' },
      { keywords: ['submit to chain', 'submit', '\u63d0\u4ea4\u4e0a\u94fe', 'to processor'], to: '/processor/dashboard' },
    ],
  },

  m01_pc: {
    actions: [{ label: '待处理批次', to: '/processor/pending' }],
    clickMap: [
      { keywords: ['pending batches', 'process workflow', '待加工批次'], to: '/processor/pending' },
      { keywords: ['upload report', 'lab results'], to: '/processor/file-upload/:batchId' },
    ],
  },
  m02_pc: {
    actions: [{ label: '处理批次', to: '/processor/process-record/:batchId' }],
    clickMap: [
      { keywords: ['process', 'view detail'], to: '/processor/process-record/:batchId' },
    ],
  },
  m03_pc: {
    actions: [{ label: '上传报告', to: '/processor/file-upload/:batchId' }],
    clickMap: [
      { keywords: ['upload report', 'submit', '上传'], to: '/processor/file-upload/:batchId' },
      { keywords: ['save draft', 'draft', '\u4fdd\u5b58\u8349\u7a3f'], to: '/processor/process-record/:batchId' },
    ],
  },
  m04_pc: {
    actions: [{ label: '完成', to: '/processor/batch-detail/:batchId' }],
    clickMap: [
      { keywords: ['download verify certificate', 'verify certificate', 'download'], to: '/processor/batch-detail/:batchId' },
      { keywords: ['timeline'], to: '/processor/batch-detail/:batchId' },
    ],
  },
  m05_pc: {
    actions: [
      { label: '返回待处理', to: '/processor/pending' },
      { label: '流转到物流方', to: '/logistics/dashboard' },
    ],
    clickMap: [
      { keywords: ['verify on chain', 'verify chain'], to: '/logistics/dashboard' },
      { keywords: ['back', 'pending'], to: '/processor/pending' },
    ],
  },

  l01_pc: {
    actions: [{ label: '待处理', to: '/logistics/pending' }],
    clickMap: [
      { keywords: ['dashboard', 'overview', '工作台', '宸ヤ綔鍙'], to: '/logistics/dashboard' },
      { keywords: ['待运输批次', 'pending actions', 'pending shipments', 'pending'], to: '/logistics/pending' },
      { keywords: ['in transit', 'transport', '运输记录', 'logistics'], to: '/logistics/transport-record/:batchId' },
      { keywords: ['history', 'audit log', 'batch detail', '批次详情'], to: '/logistics/batch-detail/:batchId' },
      { keywords: ['settings', 'system settings', '设置', '系统设置'], to: '/system/settings' },
      { keywords: ['logout', 'log out', 'sign out', '退出'], to: '/public/logout' },
      { keywords: ['accept task', 'pending', 'receive'], to: '/logistics/pending' },
    ],
  },
  l02_pc: {
    actions: [{ label: '接收任务', to: '/logistics/transport-record/:batchId' }],
    clickMap: [
      { keywords: ['dashboard', 'overview', '工作台', '宸ヤ綔鍙'], to: '/logistics/dashboard' },
      { keywords: ['待运输批次', 'pending actions', 'pending shipments', 'pending'], to: '/logistics/pending' },
      { keywords: ['in transit', 'transport', '运输记录', 'logistics'], to: '/logistics/transport-record/:batchId' },
      { keywords: ['history', 'audit log', 'batch detail', '批次详情'], to: '/logistics/batch-detail/:batchId' },
      { keywords: ['settings', 'system settings', '设置', '系统设置'], to: '/system/settings' },
      { keywords: ['logout', 'log out', 'sign out', '退出'], to: '/public/logout' },
      { keywords: ['accept task', 'start transit', 'start'], to: '/logistics/transport-record/:batchId' },
    ],
  },
  l03_pc: {
    actions: [{ label: '下一步', to: '/logistics/temp-record/:batchId' }],
    clickMap: [
      { keywords: ['dashboard', 'overview', '工作台', '宸ヤ綔鍙'], to: '/logistics/dashboard' },
      { keywords: ['待运输批次', 'pending actions', 'pending shipments', 'pending'], to: '/logistics/pending' },
      { keywords: ['in transit', 'transport', '运输记录', 'logistics'], to: '/logistics/transport-record/:batchId' },
      { keywords: ['history', 'audit log', 'batch detail', '批次详情'], to: '/logistics/batch-detail/:batchId' },
      { keywords: ['settings', 'system settings', '设置', '系统设置'], to: '/system/settings' },
      { keywords: ['logout', 'log out', 'sign out', '退出'], to: '/public/logout' },
      { keywords: ['submit to chain', 'submit', '\u63d0\u4ea4\u4e0a\u94fe', 'next', '\u4e0b\u4e00\u6b65'], to: '/logistics/temp-record/:batchId' },
      { keywords: ['save draft', 'draft', '\u4fdd\u5b58\u8349\u7a3f'], to: '/logistics/transport-record/:batchId' },
    ],
  },
  l04_pc: {
    actions: [{ label: '提交', to: '/logistics/batch-detail/:batchId' }],
    clickMap: [
      { keywords: ['dashboard', 'overview', '工作台', '宸ヤ綔鍙'], to: '/logistics/dashboard' },
      { keywords: ['待运输批次', 'pending actions', 'pending shipments', 'pending'], to: '/logistics/pending' },
      { keywords: ['in transit', 'transport', '运输记录', 'logistics'], to: '/logistics/transport-record/:batchId' },
      { keywords: ['history', 'audit log', 'batch detail', '批次详情'], to: '/logistics/batch-detail/:batchId' },
      { keywords: ['settings', 'system settings', '设置', '系统设置'], to: '/system/settings' },
      { keywords: ['logout', 'log out', 'sign out', '退出'], to: '/public/logout' },
      { keywords: ['view all records', 'records'], to: '/logistics/batch-detail/:batchId' },
      { keywords: ['export', '\u5bfc\u51fa'], to: '/logistics/batch-detail/:batchId' },
    ],
  },
  l05_pc_1: {
    actions: [
      { label: '返回待处理', to: '/logistics/pending' },
      { label: '流转到零售方', to: '/retail/dashboard' },
      { label: '打开详情V2', to: '/logistics/batch-detail-v2/:batchId' },
    ],
    clickMap: [
      { keywords: ['dashboard', 'overview', '工作台', '宸ヤ綔鍙'], to: '/logistics/dashboard' },
      { keywords: ['processing', 'pending actions', 'pending shipments', '待运输批次'], to: '/logistics/pending' },
      { keywords: ['logistics', 'in transit', 'transport'], to: '/logistics/transport-record/:batchId' },
      { keywords: ['quality control', '温湿度', 'quality'], to: '/logistics/temp-record/:batchId' },
      { keywords: ['audit log', 'history', '批次详情'], to: '/logistics/batch-detail/:batchId' },
      { keywords: ['settings', 'system settings', '设置', '系统设置'], to: '/system/settings' },
      { keywords: ['logout', 'log out', 'sign out', '退出'], to: '/public/logout' },
      { keywords: ['export manifest', 'manifest', '\u5bfc\u51fa\u8fd0\u5355', 'complete', '\u5b8c\u6210'], to: '/retail/dashboard' },
      { keywords: ['back', 'pending'], to: '/logistics/pending' },
      { keywords: ['v2', 'detail v2'], to: '/logistics/batch-detail-v2/:batchId' },
    ],
  },
  l05_pc_2: {
    actions: [
      { label: '返回待处理', to: '/logistics/pending' },
      { label: '流转到零售方', to: '/retail/dashboard' },
      { label: '返回详情V1', to: '/logistics/batch-detail/:batchId' },
    ],
    clickMap: [
      { keywords: ['dashboard', 'overview', '工作台', '宸ヤ綔鍙'], to: '/logistics/dashboard' },
      { keywords: ['pending actions', 'pending shipments', '待运输批次'], to: '/logistics/pending' },
      { keywords: ['in transit', 'transport', '运输记录'], to: '/logistics/transport-record/:batchId' },
      { keywords: ['history', 'audit log', '批次详情'], to: '/logistics/batch-detail/:batchId' },
      { keywords: ['settings', 'system settings', '设置', '系统设置'], to: '/system/settings' },
      { keywords: ['logout', 'log out', 'sign out', '退出'], to: '/public/logout' },
      { keywords: ['export pdf', 'export report', '\u5bfc\u51fa', '\u5bfc\u51fa\u62a5\u544a'], to: '/retail/dashboard' },
      { keywords: ['view all', 'pending'], to: '/logistics/pending' },
      { keywords: ['v1', 'detail v1', 'back to detail'], to: '/logistics/batch-detail/:batchId' },
    ],
  },

  r01_pc: {
    actions: [{ label: '待入库批次', to: '/retail/pending' }],
    clickMap: [
      { keywords: ['dashboard', 'overview', '工作台', '宸ヤ綔鍙'], to: '/retail/dashboard' },
      { keywords: ['inventory', 'inventory management', 'stock', '库存管理', '库存', '搴撳瓨绠＄悊', '搴撳瓨'], to: '/retail/pending' },
      { keywords: ['traceability', 'trace', '溯源', '婧簮'], to: '/retail/batch-detail/:batchId' },
      { keywords: ['qr generation', 'qr management', '二维码', 'generate qr', 'qr'], to: '/retail/qrcode/:batchId' },
      { keywords: ['risk assessment', 'audit logs', 'quality audits', 'compliance panel'], to: '/retail/batch-detail/:batchId' },
      { keywords: ['system settings', 'system setting', 'settings', '系统设置', '设置', '绯荤粺璁剧疆'], to: '/system/settings' },
      { keywords: ['support', 'contact support', 'account', '个人中心'], to: '/system/settings' },
      { keywords: ['logout', 'log out', 'sign out', '退出'], to: '/public/logout' },
      { keywords: ['receive now', 'receive task', 'stock in'], to: '/retail/pending' },
      { keywords: ['generate qr'], to: '/retail/qrcode/:batchId' },
    ],
  },
  r02_pc: {
    actions: [{ label: '录入', to: '/retail/retail-record/:batchId' }],
    clickMap: [
      { keywords: ['receive', 'entry', 'inspect'], to: '/retail/retail-record/:batchId' },
    ],
  },
  r03_pc: {
    actions: [{ label: '生成二维码', to: '/retail/qrcode/:batchId' }],
    clickMap: [
      { keywords: ['dashboard', 'overview', '工作台', '宸ヤ綔鍙'], to: '/retail/dashboard' },
      { keywords: ['inventory', 'inventory management', 'stock', '库存管理', '库存', '搴撳瓨绠＄悊', '搴撳瓨'], to: '/retail/pending' },
      { keywords: ['traceability', 'trace', '溯源', '婧簮'], to: '/retail/batch-detail/:batchId' },
      { keywords: ['qr generation', 'qr management', '二维码', 'generate qr', 'qr'], to: '/retail/qrcode/:batchId' },
      { keywords: ['risk assessment', 'audit logs', 'quality audits', 'compliance panel'], to: '/retail/batch-detail/:batchId' },
      { keywords: ['system settings', 'system setting', 'settings', '系统设置', '设置', '绯荤粺璁剧疆'], to: '/system/settings' },
      { keywords: ['support', 'contact support', 'account', '个人中心'], to: '/system/settings' },
      { keywords: ['logout', 'log out', 'sign out', '退出'], to: '/public/logout' },
      { keywords: ['submit to chain', 'submit', '\u63d0\u4ea4\u4e0a\u94fe'], to: '/retail/qrcode/:batchId' },
      { keywords: ['cancel'], to: '/retail/pending' },
    ],
  },
  r04_pc: {
    actions: [{ label: '返回详情', to: '/retail/batch-detail/:batchId' }],
    clickMap: [
      { keywords: ['submit to chain', 'submit', '\u63d0\u4ea4\u4e0a\u94fe'], to: '/retail/batch-detail/:batchId' },
      { keywords: ['preview h5', 'preview'], to: '/trace/:batchId' },
      { keywords: ['scan next item'], to: '/retail/pending' },
    ],
  },
  r05_pc_1: {
    actions: [
      { label: '预览消费者页', to: '/trace/:batchId' },
      { label: '零售批次详情', to: '/retail/batch-detail/:batchId' },
      { label: '打开二维码V2', to: '/retail/qrcode-v2/:batchId' },
    ],
    clickMap: [
      { keywords: ['preview consumer page', 'preview consumer'], to: '/trace/:batchId' },
      { keywords: ['timeline'], to: '/trace/timeline/:batchId' },
      { keywords: ['scan qr'], to: '/trace/:batchId' },
      { keywords: ['generate qr'], to: '/retail/qrcode/:batchId' },
      { keywords: ['v2', 'qr v2'], to: '/retail/qrcode-v2/:batchId' },
    ],
  },
  r05_pc_2: {
    actions: [
      { label: '预览消费者页', to: '/trace/:batchId' },
      { label: '零售批次详情', to: '/retail/batch-detail/:batchId' },
      { label: '返回二维码V1', to: '/retail/qrcode/:batchId' },
    ],
    clickMap: [
      { keywords: ['dashboard', 'overview', '工作台', '宸ヤ綔鍙'], to: '/retail/dashboard' },
      { keywords: ['inventory', 'inventory management', 'stock', '库存管理', '库存', '搴撳瓨绠＄悊', '搴撳瓨'], to: '/retail/pending' },
      { keywords: ['system settings', 'system setting', 'settings', '系统设置', '设置', '绯荤粺璁剧疆'], to: '/system/settings' },
      { keywords: ['support', 'contact support', 'account', '个人中心'], to: '/system/settings' },
      { keywords: ['logout', 'log out', 'sign out', '退出'], to: '/public/logout' },
      { keywords: ['copy url', 'download package', 'print label'], to: '/trace/:batchId' },
      { keywords: ['traceability', '\u6eaf\u6e90'], to: '/retail/batch-detail/:batchId' },
      { keywords: ['v1', 'qr v1', 'back to qr'], to: '/retail/qrcode/:batchId' },
    ],
  },
  r06_pc: {
    actions: [
      { label: '销售状态', to: '/retail/sale-status/:batchId' },
      { label: '返回待处理', to: '/retail/pending' },
    ],
    clickMap: [
      { keywords: ['view consumer qr'], to: '/trace/:batchId' },
      { keywords: ['full journey'], to: '/trace/timeline/:batchId' },
      { keywords: ['print'], to: '/retail/sale-status/:batchId' },
      { keywords: ['logistics', 'local_shipping'], to: '/logistics/dashboard' },
      { keywords: ['verify block', 'verify', '验证上链', '链上验证'], to: '/regulator/abnormal' },
    ],
  },

  g01_pc: {
    actions: [{ label: '综合检索', to: '/regulator/search' }],
    clickMap: [
      { keywords: ['overview', 'dashboard', '工作台', '宸ヤ綔鍙'], to: '/regulator/dashboard' },
      { keywords: ['inventory', 'inventory management', '库存管理', '库存', '搴撳瓨绠＄悊', '搴撳瓨'], to: '/regulator/search' },
      { keywords: ['traceability', 'trace', '溯源', '婧簮'], to: '/regulator/search' },
      { keywords: ['risk assessment', 'risk', '异常批次', 'abnormal'], to: '/regulator/abnormal' },
      { keywords: ['audit logs', 'audits', '审计日志'], to: '/regulator/audit-logs' },
      { keywords: ['support', 'contact support', 'help'], to: '/system/settings' },
      { keywords: ['logout', 'log out', 'sign out', '退出'], to: '/public/logout' },
      { keywords: ['system settings', 'system setting', 'settings', '系统设置', '设置', '绯荤粺璁剧疆'], to: '/system/settings' },
      { keywords: ['comprehensive search', 'traceability', 'view all'], to: '/regulator/search' },
      { keywords: ['audit logs', 'audits'], to: '/regulator/audit-logs' },
    ],
  },
  g02_pc: {
    actions: [
      { label: '查看详情', to: '/regulator/batch-detail/:batchId' },
      { label: '异常批次列表', to: '/regulator/abnormal' },
    ],
    clickMap: [
      { keywords: ['overview', 'dashboard', '工作台', '宸ヤ綔鍙'], to: '/regulator/dashboard' },
      { keywords: ['inventory', 'inventory management', '库存管理', '库存', '搴撳瓨绠＄悊', '搴撳瓨'], to: '/regulator/search' },
      { keywords: ['traceability', 'trace', '溯源', '婧簮'], to: '/regulator/search' },
      { keywords: ['risk assessment', 'risk', '异常批次', 'abnormal'], to: '/regulator/abnormal' },
      { keywords: ['audit logs', 'audits', '审计日志'], to: '/regulator/audit-logs' },
      { keywords: ['support', 'contact support', 'help'], to: '/system/settings' },
      { keywords: ['logout', 'log out', 'sign out', '退出'], to: '/public/logout' },
      { keywords: ['system settings', 'system setting', 'settings', '系统设置', '设置', '绯荤粺璁剧疆'], to: '/system/settings' },
      { keywords: ['trace evidence', 'evidence'], to: '/regulator/evidence/:batchId' },
      { keywords: ['audit', 'investigate'], to: '/regulator/audit/:batchId' },
      { keywords: ['details', 'view detail'], to: '/regulator/batch-detail/:batchId' },
    ],
  },
  g03_pc: {
    actions: [
      { label: '审计处理', to: '/regulator/audit/:batchId' },
      { label: '查看证据链', to: '/regulator/evidence/:batchId' },
    ],
    clickMap: [
      { keywords: ['review', 'details', 'update'], to: '/regulator/audit/:batchId' },
      { keywords: ['view report', 'evidence'], to: '/regulator/evidence/:batchId' },
    ],
  },
  g04_pc: {
    actions: [
      { label: '标记异常', to: '/regulator/flag/:batchId' },
      { label: '查看证据链', to: '/regulator/evidence/:batchId' },
      { label: '返回检索', to: '/regulator/search' },
    ],
    clickMap: [
      { keywords: ['flag as abnormal', 'flag abnormal'], to: '/regulator/flag/:batchId' },
      { keywords: ['evidence', 'transactions', 'feedback'], to: '/regulator/evidence/:batchId' },
      { keywords: ['back', 'return'], to: '/regulator/search' },
    ],
  },
  g05_pc: {
    actions: [{ label: '提交异常标记', to: '/regulator/batch-detail/:batchId' }],
    clickMap: [
      { keywords: ['submit flag', 'submit', '标记'], to: '/regulator/batch-detail/:batchId' },
      { keywords: ['cancel'], to: '/regulator/batch-detail/:batchId' },
    ],
  },
  g06_pc_1: {
    actions: [
      { label: '返回详情', to: '/regulator/batch-detail/:batchId' },
      { label: '审计动作', to: '/regulator/audit/:batchId' },
      { label: '打开证据链V2', to: '/regulator/evidence-v2/:batchId' },
    ],
    clickMap: [
      { keywords: ['re-verify chain', 'verify'], to: '/regulator/audit/:batchId' },
      { keywords: ['export audit', '\u5bfc\u51fa\u5ba1\u8ba1\u62a5\u544a', '\u5bfc\u51fa'], to: '/regulator/audit-logs' },
      { keywords: ['v2', 'evidence v2'], to: '/regulator/evidence-v2/:batchId' },
    ],
  },
  g06_pc_2: {
    actions: [
      { label: '返回详情', to: '/regulator/batch-detail/:batchId' },
      { label: '审计动作', to: '/regulator/audit/:batchId' },
      { label: '返回证据链V1', to: '/regulator/evidence/:batchId' },
    ],
    clickMap: [
      { keywords: ['generate new qr', 'qr'], to: '/retail/qrcode/:batchId' },
      { keywords: ['download report'], to: '/regulator/audit-logs' },
      { keywords: ['v1', 'evidence v1', 'back to evidence'], to: '/regulator/evidence/:batchId' },
    ],
  },
  g07_pc: {
    actions: [{ label: '提交审计', to: '/regulator/audit-logs' }],
    clickMap: [
      { keywords: ['sign commit audit', 'submit audit', '\u63d0\u4ea4\u5ba1\u8ba1'], to: '/regulator/audit-logs' },
      { keywords: ['save draft', '\u4fdd\u5b58\u8349\u7a3f'], to: '/regulator/audit/:batchId' },
      { keywords: ['view source'], to: '/regulator/batch-detail/:batchId' },
    ],
  },
  g08_pc: {
    actions: [{ label: '风险统计', to: '/regulator/stats' }],
    clickMap: [
      { keywords: ['new audit'], to: '/regulator/audit/:batchId' },
      { keywords: ['export csv', '\u5bfc\u51faCSV', '\u5bfc\u51fa'], to: '/regulator/stats' },
    ],
  },
  g09_pc: {
    actions: [{ label: '异常批次列表', to: '/regulator/abnormal' }],
    clickMap: [
      { keywords: ['verify block', 'verify'], to: '/regulator/abnormal' },
      { keywords: ['export', '\u5bfc\u51fa'], to: '/regulator/abnormal' },
    ],
  },

  c01_mobile: {
    actions: [{ label: '查询', to: '/trace/:batchId' }],
    clickMap: [
      { keywords: ['search'], to: '/trace/:batchId' },
      { keywords: ['scan', 'tap to scan'], to: '/trace/:batchId' },
    ],
  },
  c02_mobile: {
    actions: [
      { label: '时间线', to: '/trace/timeline/:batchId' },
      { label: '验证', to: '/trace/verify/:batchId' },
      { label: '反馈', to: '/trace/feedback/:batchId' },
      { label: '返回检索', to: '/trace/search' },
      { label: '打开时间线H5', to: '/trace/timeline-h5/:batchId' },
    ],
    clickMap: [
      { keywords: ['timeline'], to: '/trace/timeline/:batchId' },
      { keywords: ['view qc report', 'qc report', 'verify'], to: '/trace/verify/:batchId' },
      { keywords: ['feedback'], to: '/trace/feedback/:batchId' },
      { keywords: ['scan qr', 'scan'], to: '/trace/search' },
      { keywords: ['back'], to: '/trace/search' },
      { keywords: ['timeline h5', 'h5'], to: '/trace/timeline-h5/:batchId' },
    ],
  },
  c03_mobile: {
    actions: [{ label: '返回溯源详情', to: '/trace/:batchId' }],
    clickMap: [
      { keywords: ['back', 'traceability', '\u8fd4\u56de', '\u6eaf\u6e90\u8be6\u60c5'], to: '/trace/:batchId' },
    ],
  },
  c03_mobile_h5: {
    actions: [
      { label: '返回溯源详情', to: '/trace/:batchId' },
      { label: '返回时间线V1', to: '/trace/timeline/:batchId' },
    ],
    clickMap: [
      { keywords: ['scan', 'qr'], to: '/trace/search' },
      { keywords: ['timeline'], to: '/trace/timeline/:batchId' },
      { keywords: ['feedback'], to: '/trace/feedback/:batchId' },
      { keywords: ['v1', 'timeline v1'], to: '/trace/timeline/:batchId' },
    ],
  },
  c04_mobile_1: {
    actions: [
      { label: '返回溯源详情', to: '/trace/:batchId' },
      { label: '打开验证V2', to: '/trace/verify-v2/:batchId' },
    ],
    clickMap: [
      { keywords: ['back to traceability detail', 'back', '\u8fd4\u56de\u6eaf\u6e90\u8be6\u60c5', '\u8fd4\u56de'], to: '/trace/:batchId' },
      { keywords: ['view original file', 'transaction'], to: '/trace/:batchId' },
      { keywords: ['v2', 'verify v2'], to: '/trace/verify-v2/:batchId' },
    ],
  },
  c04_mobile_2: {
    actions: [
      { label: '返回溯源详情', to: '/trace/:batchId' },
      { label: '返回验证V1', to: '/trace/verify/:batchId' },
    ],
    clickMap: [
      { keywords: ['back', 'return'], to: '/trace/:batchId' },
      { keywords: ['re-verify', 'verify'], to: '/trace/verify/:batchId' },
      { keywords: ['v1', 'verify v1'], to: '/trace/verify/:batchId' },
    ],
  },
  c05_mobile: {
    actions: [{ label: '提交反馈', to: '/trace/feedback/success' }],
    clickMap: [
      { keywords: ['submit report', 'submit feedback', 'submit', '\u63d0\u4ea4\u53cd\u9988', '\u63d0\u4ea4'], to: '/trace/feedback/success' },
      { keywords: ['search'], to: '/trace/search' },
      { keywords: ['timeline'], to: '/trace/timeline/:batchId' },
      { keywords: ['verify'], to: '/trace/verify/:batchId' },
    ],
  },
  c06_mobile_1: {
    actions: [
      { label: '返回溯源详情', to: '/trace/:batchId' },
      { label: '再次查询', to: '/trace/search' },
      { label: '打开成功页V2', to: '/trace/feedback/success-v2' },
    ],
    clickMap: [
      { keywords: ['return to traceability', 'back to traceability', '\u8fd4\u56de\u6eaf\u6e90\u9875\u9762', '\u8fd4\u56de\u6eaf\u6e90\u8be6\u60c5'], to: '/trace/:batchId' },
      { keywords: ['search home', 'search again'], to: '/trace/search' },
      { keywords: ['v2', 'success v2'], to: '/trace/feedback/success-v2' },
    ],
  },
  c06_mobile_2: {
    actions: [
      { label: '返回溯源详情', to: '/trace/:batchId' },
      { label: '再次查询', to: '/trace/search' },
      { label: '返回成功页V1', to: '/trace/feedback/success' },
    ],
    clickMap: [
      { keywords: ['back to traceability detail', 'back'], to: '/trace/:batchId' },
      { keywords: ['scan another product', 'scan'], to: '/trace/search' },
      { keywords: ['v1', 'success v1', 'back to success'], to: '/trace/feedback/success' },
    ],
  },

  a01_pc: {
    actions: [{ label: '用户审核', to: '/admin/user-audit' }],
    clickMap: [
      { keywords: ['review', 'view all', 'audit'], to: '/admin/user-audit' },
      { keywords: ['verify', 'timeline', 'feedback'], to: '/admin/user-audit' },
    ],
  },
  a02_pc: {
    actions: [{ label: '用户与角色', to: '/admin/user-role' }],
    clickMap: [
      { keywords: ['approve', 'reject', 'audit'], to: '/admin/user-role' },
      { keywords: ['export'], to: '/admin/user-audit' },
    ],
  },
  a03_pc: {
    actions: [{ label: '节点状态', to: '/admin/node-status' }],
    clickMap: [
      { keywords: ['new user', 'edit role', 'enable', 'disable'], to: '/admin/user-role' },
      { keywords: ['search'], to: '/admin/user-role' },
    ],
  },
  a04_pc: {
    actions: [{ label: '合约配置', to: '/admin/contract-config' }],
    clickMap: [
      { keywords: ['provision node', 'node'], to: '/admin/contract-config' },
      { keywords: ['export'], to: '/admin/node-status' },
    ],
  },
  a05_pc: {
    actions: [{ label: '操作日志', to: '/admin/logs' }],
    clickMap: [
      { keywords: ['refresh state', 'sync'], to: '/admin/logs' },
      { keywords: ['traceability'], to: '/admin/dashboard' },
    ],
  },
  a06_pc: {
    actions: [{ label: '返回管理首页', to: '/admin/dashboard' }],
    clickMap: [
      { keywords: ['search', 'view'], to: '/admin/logs' },
      { keywords: ['export'], to: '/admin/dashboard' },
    ],
  },
}

const ROLE_BY_ROUTE_PREFIX = [
  { prefix: '/admin/', role: 'ADMIN' },
  { prefix: '/farmer/', role: 'FARMER' },
  { prefix: '/processor/', role: 'PROCESSOR' },
  { prefix: '/logistics/', role: 'LOGISTICS' },
  { prefix: '/retail/', role: 'RETAIL' },
  { prefix: '/regulator/', role: 'REGULATOR' },
]

const normalizeText = (value) => String(value || '').toLowerCase().replaceAll(/[^a-z0-9\u4e00-\u9fa5\s]+/g, ' ').replaceAll(/\s+/g, ' ').trim()
const STOP_WORDS = new Set(['to', 'go', 'back', 'view', 'new', 'list', 'detail', 'batch', 'the', 'and', 'again'])

const GROUP_FALLBACKS = {
  a: [
    { keywords: ['dashboard', 'overview', 'home', '工作台', '概览', '首页'], to: '/admin/dashboard' },
    { keywords: ['audit', 'review', 'approve', 'reject', 'audits', 'evidence', 'gavel'], to: '/admin/user-audit' },
    { keywords: ['user', 'role', 'management', 'traceability', '溯源'], to: '/admin/user-role' },
    { keywords: ['node', 'network', 'lan'], to: '/admin/node-status' },
    { keywords: ['contract', 'config', 'farmer network', 'logistics', 'quality audits'], to: '/admin/contract-config' },
    { keywords: ['log', 'history', 'report', 'export', '\u65e5\u5fd7', '\u5bfc\u51fa'], to: '/admin/logs' },
    { keywords: ['inventory', 'inventory management', '库存', '库存管理'], to: '/admin/user-role' },
    { keywords: ['settings', 'system settings', 'system setting', '设置', '系统设置'], to: '/system/settings' },
    { keywords: ['support', 'contact support', 'account', 'help'], to: '/system/settings' },
    { keywords: ['logout', 'log out', 'sign out', '退出'], to: '/public/logout' },
  ],
  f: [
    { keywords: ['dashboard', 'workbench', 'home', '工作台', '首页'], to: '/farmer/dashboard' },
    { keywords: ['new batch', 'create batch', 'add'], to: '/farmer/batch-create' },
    { keywords: ['record', 'entry', 'farm', 'profile'], to: '/farmer/records/:batchId' },
    { keywords: ['batch management', 'inventory', 'my batch', 'traceability', '批次管理', '库存', '我的批次', '溯源'], to: '/farmer/batches' },
    { keywords: ['detail', 'verify', 'quality', 'audit', 'compliance'], to: '/farmer/batch-detail/:batchId' },
    { keywords: ['settings', 'system settings', 'system setting', '设置', '系统设置'], to: '/system/settings' },
    { keywords: ['support', 'contact support', 'account', 'help', 'scan qr', '提交上链'], to: '/system/settings' },
    { keywords: ['logout', 'log out', 'sign out', '退出'], to: '/public/logout' },
    { keywords: ['logistics', 'local shipping'], to: '/logistics/dashboard' },
  ],
  m: [
    { keywords: ['dashboard', 'overview', '工作台', '概览'], to: '/processor/dashboard' },
    { keywords: ['pending', 'processing', 'batch processing', 'batch management', '批次管理'], to: '/processor/pending' },
    { keywords: ['process', 'quality', 'inspection', 'qc'], to: '/processor/process-record/:batchId' },
    { keywords: ['upload', 'report', 'file'], to: '/processor/file-upload/:batchId' },
    { keywords: ['traceability', '\u6eaf\u6e90', 'log', 'detail', 'verify'], to: '/processor/batch-detail/:batchId' },
    { keywords: ['inventory', 'inventory management', '库存', '库存管理'], to: '/processor/pending' },
    { keywords: ['settings', 'system settings', 'system setting', '设置', '系统设置'], to: '/system/settings' },
    { keywords: ['support', 'contact support', 'account', 'help', 'search'], to: '/system/settings' },
    { keywords: ['logout', 'log out', 'sign out', '退出'], to: '/public/logout' },
    { keywords: ['initiate new batch', 'new batch', 'create batch'], to: '/processor/pending' },
    { keywords: ['logistics', 'local shipping'], to: '/logistics/dashboard' },
    { keywords: ['compliance panel', 'audits', 'management', 'node status', 'evidence'], to: '/processor/batch-detail/:batchId' },
  ],
  l: [
    { keywords: ['dashboard', 'overview', '工作台', '概览'], to: '/logistics/dashboard' },
    { keywords: ['pending', 'shipment', 'receive', 'processing', '待运输批次'], to: '/logistics/pending' },
    { keywords: ['transit', 'transport', 'start', 'accept'], to: '/logistics/transport-record/:batchId' },
    { keywords: ['temp', 'environment', 'record', 'quality', 'quality control'], to: '/logistics/temp-record/:batchId' },
    { keywords: ['history', 'detail', 'report', 'manifest', 'audit log'], to: '/logistics/batch-detail/:batchId' },
    { keywords: ['inventory', 'inventory management', '库存', '库存管理'], to: '/logistics/pending' },
    { keywords: ['settings', 'system settings', 'system setting', '设置', '系统设置'], to: '/system/settings' },
    { keywords: ['logout', 'log out', 'sign out', '退出'], to: '/public/logout' },
    { keywords: ['support', 'contact support', 'help'], to: '/system/settings' },
  ],
  r: [
    { keywords: ['dashboard', 'overview', '工作台', '概览'], to: '/retail/dashboard' },
    { keywords: ['inventory', 'pending', 'receive', 'stock', '库存', '待处理', '入库'], to: '/retail/pending' },
    { keywords: ['record', 'entry', 'inspect'], to: '/retail/retail-record/:batchId' },
    { keywords: ['qr', 'generate', 'label', 'scan'], to: '/retail/qrcode/:batchId' },
    { keywords: ['sale', 'status', 'audit', 'quality control'], to: '/retail/sale-status/:batchId' },
    { keywords: ['traceability', 'detail', 'journey', '溯源', '详情', 'compliance panel'], to: '/retail/batch-detail/:batchId' },
    { keywords: ['settings', 'system settings', 'system setting', '设置', '系统设置'], to: '/system/settings' },
    { keywords: ['logistics', '物流'], to: '/logistics/dashboard' },
    { keywords: ['verify block', 'verify', '验证上链', '链上验证'], to: '/regulator/abnormal' },
    { keywords: ['logout', 'log out', 'sign out', '退出'], to: '/public/logout' },
    { keywords: ['support', 'contact support', 'account'], to: '/system/settings' },
    { keywords: ['risk assessment'], to: '/retail/batch-detail/:batchId' },
  ],
  g: [
    { keywords: ['dashboard', 'overview', '工作台', '概览'], to: '/regulator/dashboard' },
    { keywords: ['search', 'traceability', 'investigate', '搜索', '检索', '溯源'], to: '/regulator/search' },
    { keywords: ['management', 'user management', 'role management', '管理', '用户管理', '角色管理'], to: '/admin/user-role' },
    { keywords: ['node status', 'node', 'network', '节点状态', '节点'], to: '/admin/node-status' },
    { keywords: ['abnormal', 'risk', 'warning', 'flagged'], to: '/regulator/abnormal' },
    { keywords: ['detail', 'report'], to: '/regulator/batch-detail/:batchId' },
    { keywords: ['flag', 'mark abnormal', 'gavel'], to: '/regulator/flag/:batchId' },
    { keywords: ['evidence', 'chain', 'transaction'], to: '/regulator/evidence/:batchId' },
    { keywords: ['audit', 'review'], to: '/regulator/audit/:batchId' },
    { keywords: ['log', 'records'], to: '/regulator/audit-logs' },
    { keywords: ['stats', 'statistics'], to: '/regulator/stats' },
    { keywords: ['inventory', 'inventory management', '库存', '库存管理'], to: '/regulator/search' },
    { keywords: ['settings', 'system settings', 'system setting', '设置', '系统设置'], to: '/system/settings' },
    { keywords: ['logout', 'log out', 'sign out', '退出'], to: '/public/logout' },
    { keywords: ['support', 'contact support', 'help'], to: '/system/settings' },
  ],
  c: [
    { keywords: ['search', 'scan', '搜索', '扫码'], to: '/trace/search' },
    { keywords: ['traceability', 'detail', 'journey', '溯源', '详情'], to: '/trace/:batchId' },
    { keywords: ['timeline'], to: '/trace/timeline/:batchId' },
    { keywords: ['verify', 'qc report'], to: '/trace/verify/:batchId' },
    { keywords: ['feedback', 'report issue', '反馈', '问题反馈'], to: '/trace/feedback/:batchId' },
  ],
  p: [
    { keywords: ['login', 'sign in', '登录'], to: '/login' },
    { keywords: ['register', 'sign up', '注册'], to: '/register' },
    { keywords: ['trace', 'consumer', 'search', '消费者溯源', '消费者查询', '溯源查询'], to: '/trace/search' },
    { keywords: ['pending', '\u5f85\u5ba1\u6838', '\u5ba1\u6838\u4e2d'], to: '/public/pending' },
  ],
}

const inferSlugGroup = (slug) => String(slug || '').split('_')[0]?.charAt(0)?.toLowerCase() || ''

export const resolveRoleByRoute = (to) => {
  const path = String(to || '')
  if (path === '/system/settings') return 'ADMIN'
  const matched = ROLE_BY_ROUTE_PREFIX.find((item) => path.startsWith(item.prefix))
  return matched?.role || ''
}

export const resolveRouteTemplate = (to, context = {}) => {
  const batchId = context.batchId || SAMPLE_BATCH_ID
  return String(to).replaceAll(':batchId', batchId)
}

export const getPrototypeActions = (slug, context = {}) => {
  const conf = bySlug[slug]
  if (!conf?.actions) return []
  return conf.actions.map((item) => ({ ...item, to: resolveRouteTemplate(item.to, context) }))
}

export const getPrototypeClickMap = (slug, context = {}) => {
  const conf = bySlug[slug]
  if (!conf?.clickMap) return []
  return conf.clickMap.map((item) => ({ ...item, to: resolveRouteTemplate(item.to, context) }))
}

export const inferRouteByText = (slug, text, context = {}, options = {}) => {
  const { allowGroupFallback = true } = options
  const normalized = normalizeText(text)
  if (!normalized) return ''

  const staticMap = getPrototypeClickMap(slug, context)
  const staticHit = staticMap.find((item) => item.keywords.some((k) => normalized.includes(normalizeText(k))))
  if (staticHit) return staticHit.to

  const actionMap = getPrototypeActions(slug, context)
  let best = { score: 0, to: '' }

  for (const item of actionMap) {
    const label = normalizeText(item.label)
    if (!label) continue
    if (normalized.includes(label) || label.includes(normalized)) {
      const score = Math.min(label.length, normalized.length) + 100
      if (score > best.score) best = { score, to: item.to }
      continue
    }

    const tokens = label.split(' ').filter((tok) => tok.length >= 3 && !STOP_WORDS.has(tok))
    if (!tokens.length) continue
    const hit = tokens.filter((tok) => normalized.includes(tok)).length
    if (!hit) continue
    const score = hit * 10 + label.length * 0.01
    if (score > best.score) best = { score, to: item.to }
  }

  if (allowGroupFallback) {
    const group = inferSlugGroup(slug)
    const fallbackMap = GROUP_FALLBACKS[group] || []
    for (const item of fallbackMap) {
      const matched = item.keywords.some((kw) => normalized.includes(kw))
      if (matched) return resolveRouteTemplate(item.to, context)
    }
  }

  return best.to
}

export const inferSlugByPath = (path) => {
  const p = String(path || '')
  if (p === '/system/settings') return 'a05_pc'
  if (p === '/login') return 'p01_pc'
  if (p === '/register') return 'p02_pc'
  if (p === '/public/pending') return 'p03_pc'
  if (p === '/common/403') return 'p04_pc'
  if (p === '/common/404') return 'p05_404_pc'
  if (p === '/public/logout') return 'p06_pc_1'
  if (p === '/public/logout-alt') return 'p06_pc_2'

  if (p === '/admin/dashboard') return 'a01_pc'
  if (p === '/admin/user-audit') return 'a02_pc'
  if (p === '/admin/user-role') return 'a03_pc'
  if (p === '/admin/node-status') return 'a04_pc'
  if (p === '/admin/contract-config') return 'a05_pc'
  if (p === '/admin/logs') return 'a06_pc'

  if (p === '/farmer/dashboard') return 'f01_pc'
  if (p === '/farmer/batch-create') return 'f02_pc'
  if (p.startsWith('/farmer/records/')) return 'f03_pc'
  if (p === '/farmer/batches') return 'f04_pc'
  if (p.startsWith('/farmer/batch-detail/')) return 'f05_pc'

  if (p === '/processor/dashboard') return 'm01_pc'
  if (p === '/processor/pending') return 'm02_pc'
  if (p.startsWith('/processor/process-record/')) return 'm03_pc'
  if (p.startsWith('/processor/file-upload/')) return 'm04_pc'
  if (p.startsWith('/processor/batch-detail/')) return 'm05_pc'

  if (p === '/logistics/dashboard') return 'l01_pc'
  if (p === '/logistics/pending') return 'l02_pc'
  if (p.startsWith('/logistics/transport-record/')) return 'l03_pc'
  if (p.startsWith('/logistics/temp-record/')) return 'l04_pc'
  if (p.startsWith('/logistics/batch-detail-v2/')) return 'l05_pc_2'
  if (p.startsWith('/logistics/batch-detail/')) return 'l05_pc_1'

  if (p === '/retail/dashboard') return 'r01_pc'
  if (p === '/retail/pending') return 'r02_pc'
  if (p.startsWith('/retail/retail-record/')) return 'r03_pc'
  if (p.startsWith('/retail/sale-status/')) return 'r04_pc'
  if (p.startsWith('/retail/qrcode-v2/')) return 'r05_pc_2'
  if (p.startsWith('/retail/qrcode/')) return 'r05_pc_1'
  if (p.startsWith('/retail/batch-detail/')) return 'r06_pc'

  if (p === '/regulator/dashboard') return 'g01_pc'
  if (p === '/regulator/search') return 'g02_pc'
  if (p === '/regulator/abnormal') return 'g03_pc'
  if (p.startsWith('/regulator/batch-detail/')) return 'g04_pc'
  if (p.startsWith('/regulator/flag/')) return 'g05_pc'
  if (p.startsWith('/regulator/evidence-v2/')) return 'g06_pc_2'
  if (p.startsWith('/regulator/evidence/')) return 'g06_pc_1'
  if (p.startsWith('/regulator/audit/')) return 'g07_pc'
  if (p === '/regulator/audit-logs') return 'g08_pc'
  if (p === '/regulator/stats') return 'g09_pc'

  if (p === '/trace/search') return 'c01_mobile'
  if (/^\/trace\/[^/]+$/.test(p)) return 'c02_mobile'
  if (p === '/trace/feedback/success-v2') return 'c06_mobile_2'
  if (p === '/trace/feedback/success') return 'c06_mobile_1'
  if (p.startsWith('/trace/timeline-h5/')) return 'c03_mobile_h5'
  if (p.startsWith('/trace/timeline/')) return 'c03_mobile'
  if (p.startsWith('/trace/verify-v2/')) return 'c04_mobile_2'
  if (p.startsWith('/trace/verify/')) return 'c04_mobile_1'
  if (p.startsWith('/trace/feedback/') && !p.endsWith('/success')) return 'c05_mobile'

  return ''
}




