// Dashboard feature module
export const dashboardConfig = {
  layout: 'grid',
  widgets: ['chart', 'table'],
};

export function renderDashboard(): string {
  return '<div>Dashboard</div>';
}
