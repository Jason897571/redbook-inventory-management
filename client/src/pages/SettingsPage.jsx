import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import TagManager from '@/components/TagManager';

export default function SettingsPage() {
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { api.getSettings().then(setSettings); }, []);

  const save = async () => {
    setSaving(true);
    try {
      const updated = await api.updateSettings(settings);
      setSettings(updated);
    } finally {
      setSaving(false);
    }
  };

  if (!settings) return <div className="text-muted-foreground">加载中...</div>;

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-bold mb-6">设置</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Info */}
        <div className="bg-card rounded-lg p-4 border border-border space-y-4">
          <h2 className="font-semibold">基本信息</h2>
          <div>
            <Label className="text-muted-foreground text-xs">店铺名称</Label>
            <Input value={settings.shopName} onChange={(e) => setSettings({ ...settings, shopName: e.target.value })} />
          </div>
          <div>
            <Label className="text-muted-foreground text-xs">默认平台佣金率 (%)</Label>
            <Input type="number" step="0.1" value={(settings.defaultCommissionRate * 100).toFixed(1)} onChange={(e) => setSettings({ ...settings, defaultCommissionRate: parseFloat(e.target.value) / 100 })} />
          </div>
        </div>

        {/* Dynamic Options */}
        <div className="bg-card rounded-lg p-4 border border-border space-y-6">
          <h2 className="font-semibold">动态选项</h2>
          <TagManager label="产品款式" tags={settings.productStyles || []} onChange={(v) => setSettings({ ...settings, productStyles: v })} />
          <TagManager label="材料分类" tags={settings.materialCategories || []} onChange={(v) => setSettings({ ...settings, materialCategories: v })} />
          <TagManager label="珠子材质" tags={settings.beadCategories || []} onChange={(v) => setSettings({ ...settings, beadCategories: v })} />
          <TagManager label="材料单位" tags={settings.materialUnits || []} onChange={(v) => setSettings({ ...settings, materialUnits: v })} />
          <TagManager label="库存变动类型" tags={settings.stockChangeTypes || []} onChange={(v) => setSettings({ ...settings, stockChangeTypes: v })} />
        </div>
      </div>
      <div className="mt-6">
        <Button onClick={save} disabled={saving}>{saving ? '保存中...' : '保存设置'}</Button>
      </div>
    </div>
  );
}
