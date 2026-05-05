import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ImageUpload from '@/components/ImageUpload';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [seriesList, setSeriesList] = useState([]);
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      api.getProduct(id),
      api.getMaterials(),
      api.getSeries(),
      api.getSettings(),
    ]).then(([prod, mats, series, sets]) => {
      setProduct(prod);
      setMaterials(mats);
      setSeriesList(series);
      setSettings(sets);
    });
  }, [id]);

  const updateField = (field, value) => {
    setProduct({ ...product, [field]: value });
  };

  const addBomItem = (materialId) => {
    const mat = materials.find((m) => m._id === materialId);
    if (!mat) return;
    const bom = [...(product.materials || []), { material: mat, quantity: 1, unitCost: mat.unitPrice }];
    setProduct({ ...product, materials: bom });
  };

  const updateBomItem = (index, field, value) => {
    const bom = [...product.materials];
    bom[index] = { ...bom[index], [field]: value };
    setProduct({ ...product, materials: bom });
  };

  const removeBomItem = (index) => {
    const bom = product.materials.filter((_, i) => i !== index);
    setProduct({ ...product, materials: bom });
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        ...product,
        series: product.series?._id || product.series,
        materials: product.materials.map((item) => ({
          material: item.material?._id || item.material,
          quantity: item.quantity,
          unitCost: item.unitCost,
        })),
      };
      delete payload.totalCost;
      delete payload.profit;
      delete payload.netProfit;
      delete payload.profitMargin;
      delete payload.id;
      const updated = await api.updateProduct(id, payload);
      setProduct(updated);
    } finally {
      setSaving(false);
    }
  };

  if (!product) return <div className="text-gray-400">加载中...</div>;

  // Calculate costs
  const totalCost = (product.materials || []).reduce((sum, item) => sum + item.quantity * item.unitCost, 0);
  const profit = product.price - totalCost;
  const commission = profit * product.commissionRate;
  const netProfit = profit * (1 - product.commissionRate);
  const profitMargin = product.price > 0 ? (netProfit / product.price * 100) : 0;

  // Available materials not already in BOM
  const usedMaterialIds = new Set((product.materials || []).map((m) => m.material?._id || m.material));
  const availableMaterials = materials.filter((m) => !usedMaterialIds.has(m._id));

  const productStyles = settings?.productStyles || [];

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/products')} className="text-gray-400 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold">{product.name}</h1>
        <span className="text-gray-500 text-sm">{product.code}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Info + BOM */}
        <div className="lg:col-span-2 space-y-4">
          {/* Basic Info */}
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-4 space-y-3">
            <h2 className="font-semibold text-sm text-gray-300">基本信息</h2>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs text-gray-400">编号</Label><Input value={product.code} onChange={(e) => updateField('code', e.target.value)} className="bg-gray-800 border-gray-700" /></div>
              <div><Label className="text-xs text-gray-400">名称</Label><Input value={product.name} onChange={(e) => updateField('name', e.target.value)} className="bg-gray-800 border-gray-700" /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs text-gray-400">系列</Label>
                <Select value={product.series?._id || product.series || ''} onValueChange={(v) => updateField('series', v)}>
                  <SelectTrigger className="bg-gray-800 border-gray-700"><SelectValue /></SelectTrigger>
                  <SelectContent>{seriesList.map((s) => <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs text-gray-400">定价 (¥)</Label><Input type="number" step="0.1" value={product.price} onChange={(e) => updateField('price', parseFloat(e.target.value) || 0)} className="bg-gray-800 border-gray-700" /></div>
              <div><Label className="text-xs text-gray-400">佣金率 (%)</Label><Input type="number" step="0.1" value={(product.commissionRate * 100).toFixed(1)} onChange={(e) => updateField('commissionRate', parseFloat(e.target.value) / 100)} className="bg-gray-800 border-gray-700" /></div>
            </div>
            <div>
              <Label className="text-xs text-gray-400">款式</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {productStyles.map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      const styles = product.styles.includes(s)
                        ? product.styles.filter((st) => st !== s)
                        : [...product.styles, s];
                      updateField('styles', styles);
                    }}
                    className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                      product.styles.includes(s)
                        ? 'bg-blue-600 border-blue-500 text-white'
                        : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label className="text-xs text-gray-400">几个装</Label><Input type="number" value={product.pieceCount} onChange={(e) => updateField('pieceCount', parseInt(e.target.value) || 1)} className="bg-gray-800 border-gray-700" /></div>
              <div><Label className="text-xs text-gray-400">库存</Label><Input type="number" value={product.stock} onChange={(e) => updateField('stock', parseInt(e.target.value) || 0)} className="bg-gray-800 border-gray-700" /></div>
              <div><Label className="text-xs text-gray-400">报警阈值</Label><Input type="number" value={product.stockAlertThreshold} onChange={(e) => updateField('stockAlertThreshold', parseInt(e.target.value) || 0)} className="bg-gray-800 border-gray-700" /></div>
            </div>
          </div>

          {/* BOM Table */}
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-sm text-gray-300">BOM 材料清单</h2>
              {availableMaterials.length > 0 && (
                <Select onValueChange={addBomItem}>
                  <SelectTrigger className="w-48 bg-gray-800 border-gray-700 text-xs">
                    <SelectValue placeholder="+ 添加材料" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableMaterials.map((m) => (
                      <SelectItem key={m._id} value={m._id}>{m.name} (¥{m.unitPrice})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-xs">
                  <th className="pb-2 text-left">材料</th>
                  <th className="pb-2 text-right">单价</th>
                  <th className="pb-2 text-right w-24">用量</th>
                  <th className="pb-2 text-right">小计</th>
                  <th className="pb-2 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {(product.materials || []).map((item, i) => (
                  <tr key={i} className="border-t border-gray-800">
                    <td className="py-2 text-white">{item.material?.name || '未知材料'}</td>
                    <td className="py-2 text-right text-gray-400">¥{item.unitCost.toFixed(4)}</td>
                    <td className="py-2 text-right">
                      <Input
                        type="number"
                        step="0.1"
                        value={item.quantity}
                        onChange={(e) => updateBomItem(i, 'quantity', parseFloat(e.target.value) || 0)}
                        className="w-20 bg-gray-800 border-gray-700 text-right text-sm ml-auto"
                      />
                    </td>
                    <td className="py-2 text-right text-gray-300">¥{(item.quantity * item.unitCost).toFixed(4)}</td>
                    <td className="py-2 text-center">
                      <button onClick={() => removeBomItem(i)} className="text-gray-500 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                    </td>
                  </tr>
                ))}
                {(!product.materials || product.materials.length === 0) && (
                  <tr><td colSpan={5} className="py-4 text-center text-gray-500 text-xs">暂无材料，从上方添加</td></tr>
                )}
              </tbody>
              {product.materials?.length > 0 && (
                <tfoot>
                  <tr className="border-t border-gray-700">
                    <td colSpan={3} className="py-2 text-right font-medium text-gray-400">总成本:</td>
                    <td className="py-2 text-right font-bold text-white">¥{totalCost.toFixed(4)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {/* Right: Image + Profit */}
        <div className="space-y-4">
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
            <h2 className="font-semibold text-sm text-gray-300 mb-3">产品图片</h2>
            <ImageUpload value={product.image} onChange={(url) => updateField('image', url)} />
          </div>

          <div className="bg-gray-900 rounded-lg border border-gray-800 p-4 space-y-3">
            <h2 className="font-semibold text-sm text-gray-300">利润计算</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-400">定价</span><span>¥{product.price.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">总成本</span><span className="text-red-400">-¥{totalCost.toFixed(2)}</span></div>
              <div className="border-t border-gray-800 pt-2 flex justify-between"><span className="text-gray-400">毛利润</span><span>¥{profit.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">佣金 ({(product.commissionRate * 100).toFixed(1)}%)</span><span className="text-red-400">-¥{commission.toFixed(2)}</span></div>
              <div className="border-t border-gray-700 pt-2 flex justify-between font-bold">
                <span className="text-white">净利润</span>
                <span className={netProfit >= 0 ? 'text-green-400' : 'text-red-400'}>¥{netProfit.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">利润率</span>
                <span className={profitMargin >= 0 ? 'text-green-400' : 'text-red-400'}>{profitMargin.toFixed(1)}%</span>
              </div>
            </div>
          </div>

          <Button className="w-full" onClick={save} disabled={saving}>
            {saving ? '保存中...' : '保存修改'}
          </Button>
        </div>
      </div>
    </div>
  );
}
