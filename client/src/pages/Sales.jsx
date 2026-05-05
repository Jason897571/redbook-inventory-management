import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShoppingCart } from 'lucide-react';

export default function Sales() {
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [period, setPeriod] = useState('');
  const [summary, setSummary] = useState({ totalRevenue: 0, totalProfit: 0, totalOrders: 0 });

  // New sale form
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');

  const load = async () => {
    const params = {};
    if (period) params.period = period;
    const [salesData, prods, sum] = await Promise.all([
      api.getSales(params),
      api.getProducts(),
      api.getSalesSummary(params),
    ]);
    setSales(salesData);
    setProducts(prods);
    setSummary(sum);
  };

  useEffect(() => { load(); }, [period]);

  const selectedProductData = products.find((p) => p._id === selectedProduct);

  const createSale = async () => {
    if (!selectedProduct || !quantity) return;
    await api.createSale({
      product: selectedProduct,
      style: selectedStyle,
      quantity: Number(quantity),
      notes,
    });
    setSelectedProduct('');
    setSelectedStyle('');
    setQuantity(1);
    setNotes('');
    load();
  };

  const deleteSale = async (id) => {
    if (!confirm('确定删除此记录？库存将恢复')) return;
    await api.deleteSale(id);
    load();
  };

  const periods = [
    { value: '', label: '全部' },
    { value: 'today', label: '今天' },
    { value: 'week', label: '本周' },
    { value: 'month', label: '本月' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">销售记录</h1>

      {/* Quick Add */}
      <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
        <h2 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2"><ShoppingCart size={16} /> 快速录入</h2>
        <div className="flex items-end gap-3 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <Label className="text-xs text-gray-400">产品</Label>
            <Select value={selectedProduct} onValueChange={(v) => { setSelectedProduct(v); setSelectedStyle(''); }}>
              <SelectTrigger className="bg-gray-800 border-gray-700"><SelectValue placeholder="选择产品" /></SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p._id} value={p._id}>{p.name} (¥{p.price})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {selectedProductData?.styles?.length > 0 && (
            <div className="w-32">
              <Label className="text-xs text-gray-400">款式</Label>
              <Select value={selectedStyle} onValueChange={setSelectedStyle}>
                <SelectTrigger className="bg-gray-800 border-gray-700"><SelectValue placeholder="选款式" /></SelectTrigger>
                <SelectContent>
                  {selectedProductData.styles.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="w-20">
            <Label className="text-xs text-gray-400">数量</Label>
            <Input type="number" min={1} value={quantity} onChange={(e) => setQuantity(e.target.value)} className="bg-gray-800 border-gray-700" />
          </div>
          <div className="w-36">
            <Label className="text-xs text-gray-400">备注</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="选填" className="bg-gray-800 border-gray-700" />
          </div>
          <Button onClick={createSale} disabled={!selectedProduct}>记录销售</Button>
        </div>
      </div>

      {/* Period Filter */}
      <div className="flex items-center gap-2">
        {periods.map((p) => (
          <Button key={p.value} variant={period === p.value ? 'default' : 'outline'} size="sm" onClick={() => setPeriod(p.value)}>
            {p.label}
          </Button>
        ))}
      </div>

      {/* Sales Table */}
      <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-800/50 text-gray-400 text-xs">
              <th className="p-3 text-left">日期</th>
              <th className="p-3 text-left">产品</th>
              <th className="p-3 text-left">款式</th>
              <th className="p-3 text-right">数量</th>
              <th className="p-3 text-right">售价</th>
              <th className="p-3 text-right">成本</th>
              <th className="p-3 text-right">净利润</th>
              <th className="p-3 text-center">操作</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((s) => (
              <tr key={s._id} className="border-t border-gray-800 hover:bg-gray-800/30 transition-colors">
                <td className="p-3 text-gray-400">{new Date(s.date).toLocaleDateString('zh-CN')}</td>
                <td className="p-3 text-white">{s.product?.name || '-'}</td>
                <td className="p-3 text-gray-400">{s.style || '-'}</td>
                <td className="p-3 text-right">{s.quantity}</td>
                <td className="p-3 text-right">¥{s.salePrice}</td>
                <td className="p-3 text-right text-gray-400">¥{s.cost?.toFixed(2)}</td>
                <td className="p-3 text-right text-green-400">¥{(s.netProfit * s.quantity).toFixed(2)}</td>
                <td className="p-3 text-center">
                  <button onClick={() => deleteSale(s._id)} className="text-red-400 hover:underline text-xs">删除</button>
                </td>
              </tr>
            ))}
            {sales.length === 0 && (
              <tr><td colSpan={8} className="p-8 text-center text-gray-500">暂无销售记录</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="bg-gray-900 rounded-lg border border-gray-800 p-4 flex items-center justify-between">
        <div className="text-sm text-gray-400">
          共 <span className="text-white font-medium">{summary.totalOrders}</span> 笔订单
        </div>
        <div className="flex gap-6 text-sm">
          <span className="text-gray-400">销售额: <span className="text-white font-medium">¥{summary.totalRevenue.toFixed(2)}</span></span>
          <span className="text-gray-400">净利润: <span className="text-green-400 font-medium">¥{summary.totalProfit.toFixed(2)}</span></span>
        </div>
      </div>
    </div>
  );
}
