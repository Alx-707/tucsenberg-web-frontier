/**
 * 自动化测试组件
 */
interface AutomatedTestSectionProps {
  testResults: string;
  isRunning: boolean;
  onRunTests: () => void;
}

export function AutomatedTestSection({
  testResults,
  isRunning,
  onRunTests
}: AutomatedTestSectionProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        自动化测试
      </h2>
      <button
        onClick={onRunTests}
        disabled={isRunning}
        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isRunning ? '正在测试...' : '运行无障碍性测试'}
      </button>

      {testResults && (
        <div className="mt-6">
          <h3 className="font-medium text-gray-900 mb-2">测试结果：</h3>
          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-auto whitespace-pre-wrap font-mono">
            {testResults}
          </pre>
        </div>
      )}
    </div>
  );
}
