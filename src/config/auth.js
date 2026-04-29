export const ROLE_OPTIONS = [
  { value: 'ADMIN', label: '平台管理员', landing: '/admin/dashboard' },
  { value: 'FARMER', label: '农户', landing: '/farmer/dashboard' },
  { value: 'PROCESSOR', label: '加工方', landing: '/processor/dashboard' },
  { value: 'LOGISTICS', label: '物流方', landing: '/logistics/dashboard' },
  { value: 'RETAIL', label: '零售方', landing: '/retail/dashboard' },
  { value: 'REGULATOR', label: '监管方', landing: '/regulator/dashboard' },
]

export const ROLE_LABELS = ROLE_OPTIONS.reduce((acc, item) => {
  acc[item.value] = item.label
  return acc
}, {})

export const resolveLandingByRole = (role) => {
  const match = ROLE_OPTIONS.find((item) => item.value === role)
  return match?.landing || '/login'
}
