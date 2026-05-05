import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ImageUpload from '@/components/ImageUpload';
import { ArrowLeft, Plus, Trash2, Package } from 'lucide-react';

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

  // --- Component helpers ---
  const addComponent = () => {
    const components = [...(product.components || []), { name: `组件${(product.components || []).length + 1}`, materials: [] }];
    setProduct({ ...product, components });
  };

  const updateComponentName = (ci, name) => {
    const components = [...product.components];
    components[ci] = { ...components[ci], name };
    setProduct({ ...product, components });
  };

  const removeComponent = (ci) => {
    const components = product.components.filter((_, i) => i !== ci);
    setProduct({ ...product, components });
  };

  const addComponentMaterial = (ci, materialId) => {
    const mat = materials.find((m) => m._id === materialId);
    if (!mat) return;
    const components = [...product.components];
    components[ci] = {
      ...components[ci],
      materials: [...components[ci].materials, { material: mat, quantity: 1, unitCost: mat.unitPrice }],
    };
    setProduct({ ...product, components });
  };

  const updateComponentMaterial = (ci, mi, field, value) => {
    const components = [...product.components];
    const mats = [...components[ci].materials];
    mats[mi] = { ...mats[mi], [field]: value };
    components[ci] = { ...components[ci], materials: mats };
    setProduct({ ...product, components });
  };

  const removeComponentMaterial = (ci, mi) => {
    const components = [...product.components];
    components[ci] = {
      ...components[ci],
      materials: components[ci].materials.filter((_, i) => i !== mi),
    };
    setProduct({ ...product, components });
  };

  // --- Shared material helpers ---
  const addSharedMaterial = (materialId) => {
    const mat = materials.find((m) => m._id === materialId);
    if (!mat) return;
    const sharedMaterials = [...(product.sharedMaterials || []), { material: mat, quantity: 1, unitCost: mat.unitPrice }];
    setProduct({ ...product, sharedMaterials });
  };

  const updateSharedMaterial = (index, field, value) => {
    const sharedMaterials = [...product.sharedMaterials];
    sharedMaterials[index] = { ...sharedMaterials[index], [field]: value };
    setProduct({ ...product, sharedMaterials });
  };

  const removeSharedMaterial = (index) => {
    const sharedMaterials = product.sharedMaterials.filter((_, i) => i !== index);
    setProduct({ ...product, sharedMaterials });
  };

  const serializeBomItems = (items) =>
    (items || []).map((item) => ({
      material: item.material?._id || item.material,
      quantity: item.quantity,
      unitCost: item.unitCost,
    }));

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        ...product,
        series: product.series?._id || product.series,
        components: (product.components || []).map((comp) => ({
          name: comp.name,
          materials: serializeBomItems(comp.materials),
        })),
        sharedMaterials: serializeBomItems(product.sharedMaterials),
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
  const componentsCost = (product.components || []).reduce((sum, comp) =>
    sum + comp.materials.reduce((s, item) => s + item.quantity * item.unitCost, 0), 0);
  const sharedCost = (product.sharedMaterials || []).reduce((sum, item) =>
    sum + item.quantity * item.unitCost, 0);
  const totalCost = componentsCost + sharedCost;
  const profit = product.price - totalCost;
  const commission = profit * product.commissionRate;
  const netProfit = profit * (1 - product.commissionRate);
  const profitMargin = product.price > 0 ? (netProfit / product.price * 100) : 0;

  const productStyles = settings?.productStyles || [];

  // Helper to render a BOM table for a materials array
  const renderBomTable = (items, onUpdate, onRemove, onAdd, label) => {
    const usedIds = new Set((items || []).map((m) => m.material?._id || m.material));
    const available = materials.filter((m) => !usedIds.has(m._id));
    const subtotal = (items || []).reduce((s, item) => s + item.quantity * item.unitCost, 0);

    return (
      <>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-500">{label}</span>
          {available.length > 0 && (
            <Select onValueChange={onAdd}>
              <SelectTrigger className="w-40 bg-gray-800 border-gray-700 text-xs h-7">
                <SelectValue placeholder="+ 添加材料" />
              </SelectTrigger>
              <SelectContent>
                {available.map((m) => (
                  <SelectItem key={m._id} value={m._id}>{m.name} (¥{m.unitPrice})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        {(items || []).length > 0 ? (
          <table className="w-full text-sm mb-2">
            <thead>
              <tr className="text-gray-500 text-xs">
                <th className="pb-1 text-left">材料</th>
                <th className="pb-1 text-right">单价</th>
                <th className="pb-1 text-right w-20">用量</th>
                <th className="pb-1 text-right">小计</th>
                <th className="pb-1 w-8"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i} className="border-t border-gray-800/50">
                  <td className="py-1.5 text-white text-xs">{item.material?.name || '未知材料'}</td>
                  <td className="py-1.5 text-right text-gray-400 text-xs">¥{item.unitCost.toFixed(4)}</td>
                  <td className="py-1.5 text-right">
                    <Input
                      type="number"
                      step="0.1"
                      value={item.quantity}
                      onChange={(e) => onUpdate(i, 'quantity', parseFloat(e.target.value) || 0)}
                      className="w-16 bg-gray-800 border-gray-700 text-right text-xs ml-auto h-7"
                    />
                  </td>
                  <td className="py-1.5 text-right text-gray-300 text-xs">¥{(item.quantity * item.unitCost).toFixed(4)}</td>
                  <td className="py-1.5 text-center">
                    <button onClick={() => onRemove(i)} className="text-gray-500 hover:text-red-400 transition-colors"><Trash2 size={12} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-gray-800">
                <td colSpan={3} className="py-1 text-right text-xs text-gray-500">小计:</td>
                <td className="py-1 text-right text-xs font-medium text-gray-300">¥{subtotal.toFixed(4)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        ) : (
          <div className="text-xs text-gray-600 py-2 text-center">暂无材料</div>
        )}
      </>
    );
  };

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

          {/* Components BOM */}
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-sm text-gray-300 flex items-center gap-2">
                <Package size={14} /> BOM 组件清单
              </h2>
              <Button size="sm" variant="outline" onClick={addComponent} className="text-xs h-7">
                <Plus size={12} className="mr-1" /> 添加组件
              </Button>
            </div>

            {(product.components || []).length === 0 ? (
              <div className="py-6 text-center text-gray-500 text-xs">
                暂无组件，点击上方按钮添加（如：雏菊珠、向日葵珠等）
              </div>
            ) : (
              <div className="space-y-4">
                {product.components.map((comp, ci) => (
                  <div key={comp._id || ci} className="bg-gray-800/40 rounded-lg p-3 border border-gray-800">
                    <div className="flex items-center gap-2 mb-2">
                      <Input
                        value={comp.name}
                        onChange={(e) => updateComponentName(ci, e.target.value)}
                        className="bg-gray-800 border-gray-700 text-sm h-7 w-48"
                        placeholder="组件名称"
                      />
                      <span className="text-xs text-gray-500 flex-1">
                        小计: ¥{comp.materials.reduce((s, item) => s + item.quantity * item.unitCost, 0).toFixed(4)}
                      </span>
                      <button onClick={() => removeComponent(ci)} className="text-gray-500 hover:text-red-400 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                    {renderBomTable(
                      comp.materials,
                      (mi, field, value) => updateComponentMaterial(ci, mi, field, value),
                      (mi) => removeComponentMaterial(ci, mi),
                      (matId) => addComponentMaterial(ci, matId),
                      `组件 ${ci + 1} 材料`,
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Shared Materials */}
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
            <h2 className="font-semibold text-sm text-gray-300 mb-3">共用材料（包装、配件等）</h2>
            {renderBomTable(
              product.sharedMaterials || [],
              updateSharedMaterial,
              removeSharedMaterial,
              addSharedMaterial,
              '共用材料',
            )}
          </div>

          {/* Cost Summary */}
          {((product.components || []).length > 0 || (product.sharedMaterials || []).length > 0) && (
            <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
              <h2 className="font-semibold text-sm text-gray-300 mb-2">成本汇总</h2>
              <div className="space-y-1 text-sm">
                {(product.components || []).map((comp, ci) => {
                  const cost = comp.materials.reduce((s, item) => s + item.quantity * item.unitCost, 0);
                  return (
                    <div key={ci} className="flex justify-between text-gray-400">
                      <span>{comp.name}</span>
                      <span>¥{cost.toFixed(4)}</span>
                    </div>
                  );
                })}
                {sharedCost > 0 && (
                  <div className="flex justify-between text-gray-400">
                    <span>共用材料</span>
                    <span>¥{sharedCost.toFixed(4)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold border-t border-gray-700 pt-1">
                  <span className="text-white">总成本</span>
                  <span className="text-white">¥{totalCost.toFixed(4)}</span>
                </div>
              </div>
            </div>
          )}
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
              <div className="flex justify-between"><span className="text-gray-400">总成本 ({(product.components || []).length}个组件)</span><span className="text-red-400">-¥{totalCost.toFixed(2)}</span></div>
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
