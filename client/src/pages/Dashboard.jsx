import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import StatsCard from '@/components/StatsCard';
import AlertList from '@/components/AlertList';
import { DollarSign, TrendingUp, AlertTriangle, Package } from 'lucide-react';

export default function Dashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.getDashboard().then(setData).catch(console.error);
  }, []);

  if (!data) return <div className="text-gray-400">加载中...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">仪表盘</h1>

      <div className="flex gap-4 flex-wrap">
        <StatsCard label="今日销售额" value={`¥${data.todayRevenue.toFixed(2)}`} icon={DollarSign} color="text-green-400" />
        <StatsCard label="今日净利润" value={`¥${data.todayProfit.toFixed(2)}`} icon={TrendingUp} color="text-blue-400" />
        <StatsCard label="库存报警" value={data.alertCount} icon={AlertTriangle} color={data.alertCount > 0 ? 'text-red-400' : 'text-gray-400'} />
        <StatsCard label="产品总数" value={data.productCount} icon={Package} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AlertList title="⚠️ 材料库存报警" items={data.materialAlerts} />
        <AlertList title="⚠️ 成品库存报警" items={data.productAlerts} />
      </div>

      <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
        <h3 className="text-sm font-medium mb-3 text-gray-300">最近销售</h3>
        {data.recentSales.length === 0 ? (
          <p className="text-gray-500 text-sm py-4 text-center">暂无销售记录</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 text-xs">
                <th className="pb-2 text-left">日期</th>
                <th className="pb-2 text-left">产品</th>
                <th className="pb-2 text-right">数量</th>
                <th className="pb-2 text-right">售价</th>
                <th className="pb-2 text-right">净利润</th>
              </tr>
            </thead>
            <tbody>
              {data.recentSales.map((s) => (
                <tr key={s._id} className="border-t border-gray-800">
                  <td className="py-2 text-gray-400">{new Date(s.date).toLocaleDateString('zh-CN')}</td>
                  <td className="py-2">{s.product?.name || '-'}</td>
                  <td className="py-2 text-right">{s.quantity}</td>
                  <td className="py-2 text-right">¥{s.salePrice}</td>
                  <td className="py-2 text-right text-green-400">¥{s.netProfit.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
