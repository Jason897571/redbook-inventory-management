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

  if (!data) return <div className="text-muted-foreground">加载中...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">仪表盘</h1>

      <div className="flex gap-4 flex-wrap">
        <StatsCard label="今日销售额" value={`¥${data.todayRevenue.toFixed(2)}`} icon={DollarSign} color="text-[var(--color-profit)]" />
        <StatsCard label="今日净利润" value={`¥${data.todayProfit.toFixed(2)}`} icon={TrendingUp} color="text-primary" />
        <StatsCard label="库存报警" value={data.alertCount} icon={AlertTriangle} color={data.alertCount > 0 ? 'text-[var(--color-loss)]' : 'text-muted-foreground'} />
        <StatsCard label="产品总数" value={data.productCount} icon={Package} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AlertList title="材料库存报警" items={data.materialAlerts} />
        <AlertList title="成品库存报警" items={data.productAlerts} />
      </div>

      <div className="bg-card rounded-lg border border-border p-4">
        <h3 className="text-sm font-medium mb-3 text-foreground">最近销售</h3>
        {data.recentSales.length === 0 ? (
          <p className="text-muted-foreground text-sm py-4 text-center">暂无销售记录</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted-foreground text-xs">
                <th className="pb-2 text-left">日期</th>
                <th className="pb-2 text-left">产品</th>
                <th className="pb-2 text-right">数量</th>
                <th className="pb-2 text-right">售价</th>
                <th className="pb-2 text-right">净利润</th>
              </tr>
            </thead>
            <tbody>
              {data.recentSales.map((s) => (
                <tr key={s._id} className="border-t border-border">
                  <td className="py-2 text-muted-foreground">{new Date(s.date).toLocaleDateString('zh-CN')}</td>
                  <td className="py-2">{s.product?.name || '-'}</td>
                  <td className="py-2 text-right">{s.quantity}</td>
                  <td className="py-2 text-right">¥{s.salePrice}</td>
                  <td className="py-2 text-right text-[var(--color-profit)]">¥{s.netProfit.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
