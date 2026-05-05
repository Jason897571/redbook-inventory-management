import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function StockLogs() {
  const [logs, setLogs] = useState([]);
  const [settings, setSettings] = useState(null);
  const [typeFilter, setTypeFilter] = useState('');
  const [changeTypeFilter, setChangeTypeFilter] = useState('');

  const load = async () => {
    const params = {};
    if (typeFilter) params.type = typeFilter;
    if (changeTypeFilter) params.changeType = changeTypeFilter;
    const [logsData, sets] = await Promise.all([api.getStockLogs(params), api.getSettings()]);
    setLogs(logsData);
    setSettings(sets);
  };

  useEffect(() => { load(); }, [typeFilter, changeTypeFilter]);

  const changeTypes = settings?.stockChangeTypes || [];

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">库存日志</h1>

      <div className="flex gap-3">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="类型: 全部" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部</SelectItem>
            <SelectItem value="material">材料</SelectItem>
            <SelectItem value="product">产品</SelectItem>
          </SelectContent>
        </Select>
        <Select value={changeTypeFilter} onValueChange={setChangeTypeFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="变动: 全部" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部</SelectItem>
            {changeTypes.map((ct) => <SelectItem key={ct} value={ct}>{ct}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 text-muted-foreground text-xs">
              <th className="p-3 text-left">日期</th>
              <th className="p-3 text-left">类型</th>
              <th className="p-3 text-left">名称</th>
              <th className="p-3 text-left">变动类型</th>
              <th className="p-3 text-right">数量</th>
              <th className="p-3 text-left">备注</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log._id} className="border-t border-border hover:bg-muted/30 transition-colors">
                <td className="p-3 text-muted-foreground">{new Date(log.date).toLocaleString('zh-CN')}</td>
                <td className="p-3">
                  <Badge variant={log.type === 'material' ? 'secondary' : 'outline'}>
                    {log.type === 'material' ? '材料' : '产品'}
                  </Badge>
                </td>
                <td className="p-3 text-foreground">{log.targetName}</td>
                <td className="p-3 text-muted-foreground">{log.changeType}</td>
                <td className={`p-3 text-right font-medium ${log.quantity > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {log.quantity > 0 ? '+' : ''}{log.quantity}
                </td>
                <td className="p-3 text-muted-foreground">{log.note}</td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">暂无日志记录</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
