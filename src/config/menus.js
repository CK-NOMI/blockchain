// activeOn: 当多个菜单项指向同一路由时，点击哪个菜单都由同一个列表页高亮，无法区分。
// activeOn: 当多个菜单项指向同一路由时，需用 activeOn 做两件事：
//   1. 高亮区分：访问 /farmer/records/xxx 时"农事记录"高亮而非"我的批次"
//   2. 同批跳转：当前页面有 batchId 时，点击菜单直接拼 activeOn + batchId 跳转，
//      而非跳到列表页（由 AppLayout.vue notifyNeedBatch 实现）
// 路由不重复的角色（如 ADMIN）不需要 activeOn。
export const roleMenus = {
  ADMIN: [
    { to: '/admin/dashboard', icon: 'dashboard', label: '平台概览' },
    { to: '/admin/user-audit', icon: 'fact_check', label: '用户审核' },
    { to: '/admin/user-role', icon: 'manage_accounts', label: '用户与角色' },
    { to: '/admin/node-status', icon: 'hub', label: '节点状态' },
    { to: '/admin/contract-config', icon: 'settings_applications', label: '合约配置' },
    { to: '/admin/logs', icon: 'article', label: '操作日志' },
  ],
  FARMER: [
    { to: '/farmer/dashboard', icon: 'dashboard', label: '工作台' },
    { to: '/farmer/batch-create', icon: 'add_box', label: '新建批次' },
    { to: '/farmer/batches', icon: 'edit_note', label: '农事记录', activeOn: '/farmer/records/' },
    { to: '/farmer/batches', icon: 'list_alt', label: '我的批次' },
    { to: '/farmer/batches', icon: 'receipt_long', label: '批次详情', activeOn: '/farmer/batch-detail/' },
  ],
  PROCESSOR: [
    { to: '/processor/dashboard', icon: 'dashboard', label: '工作台' },
    { to: '/processor/pending', icon: 'inventory_2', label: '待加工批次' },
    { to: '/processor/pending', icon: 'science', label: '加工与质检', activeOn: '/processor/process-record/' },
    { to: '/processor/pending', icon: 'upload_file', label: '上传与验真', activeOn: '/processor/file-upload/' },
    { to: '/processor/pending', icon: 'info', label: '批次详情', activeOn: '/processor/batch-detail/' },
  ],
  LOGISTICS: [
    { to: '/logistics/dashboard', icon: 'dashboard', label: '工作台' },
    { to: '/logistics/pending', icon: 'view_list', label: '待运输批次' },
    { to: '/logistics/pending', icon: 'local_shipping', label: '运输记录', activeOn: '/logistics/transport-record/' },
    { to: '/logistics/pending', icon: 'thermostat', label: '温湿度记录', activeOn: '/logistics/temp-record/' },
    { to: '/logistics/pending', icon: 'info', label: '批次详情', activeOn: '/logistics/batch-detail/' },
  ],
  RETAIL: [
    { to: '/retail/dashboard', icon: 'dashboard', label: '工作台' },
    { to: '/retail/pending', icon: 'inventory', label: '待入库批次' },
    { to: '/retail/pending', icon: 'store', label: '入库与上架', activeOn: '/retail/retail-record/' },
    { to: '/retail/pending', icon: 'sell', label: '销售状态', activeOn: '/retail/sale-status/' },
    { to: '/retail/pending', icon: 'qr_code_2', label: '二维码', activeOn: '/retail/qrcode/' },
    { to: '/retail/pending', icon: 'info', label: '批次详情', activeOn: '/retail/batch-detail/' },
  ],
  REGULATOR: [
    { to: '/regulator/dashboard', icon: 'dashboard', label: '风险看板' },
    { to: '/regulator/search', icon: 'search', label: '综合检索' },
    { to: '/regulator/abnormal', icon: 'warning', label: '异常批次' },
    { to: '/regulator/search', icon: 'description', label: '批次详情', activeOn: '/regulator/batch-detail/' },
    { to: '/regulator/search', icon: 'flag', label: '标记异常', activeOn: '/regulator/flag/' },
    { to: '/regulator/search', icon: 'shield', label: '证据链', activeOn: '/regulator/evidence/' },
    { to: '/regulator/search', icon: 'gavel', label: '审计处理', activeOn: '/regulator/audit/' },
    { to: '/regulator/audit-logs', icon: 'history', label: '审计日志' },
    { to: '/regulator/stats', icon: 'bar_chart', label: '风险统计' },
  ],
}
