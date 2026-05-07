import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { useSettings } from '@/lib/SettingsContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import ImageUpload from '@/components/ImageUpload';
import TagManager from '@/components/TagManager';

export default function SettingsPage() {
  const { settings: globalSettings, setSettings: setGlobalSettings } = useSettings();
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    api.getSettings().then(setSettings);
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        ...settings,
        defaultCommissionRate: parseFloat(settings.defaultCommissionRate) || 0,
      };
      const updated = await api.updateSettings(payload);
      setSettings(updated);
      setGlobalSettings(updated);
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await api.exportData();
    } catch (err) {
      alert('导出失败: ' + err.message);
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset file input so the same file can be selected again
    e.target.value = '';

    if (!window.confirm('导入将覆盖所有现有数据，确定继续吗？')) return;

    setImporting(true);
    try {
      const result = await api.importData(file);
      alert(`导入成功！\n材料: ${result.stats.materials}\n半成品: ${result.stats.semiProducts}\n产品: ${result.stats.products}\n系列: ${result.stats.productSeries}\n销售记录: ${result.stats.saleRecords}\n库存日志: ${result.stats.stockLogs}\n图片: ${result.stats.images}`);
      // Reload settings after import
      const newSettings = await api.getSettings();
      setSettings(newSettings);
      setGlobalSettings(newSettings);
    } catch (err) {
      alert('导入失败: ' + err.message);
    } finally {
      setImporting(false);
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
            <Label className="text-muted-foreground text-xs">店铺图标</Label>
            <div className="mt-1">
              <ImageUpload
                value={settings.shopIcon || ''}
                onChange={(url) => setSettings({ ...settings, shopIcon: url })}
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">显示在左上角，替代默认图标</p>
          </div>
          <div>
            <Label className="text-muted-foreground text-xs">店铺名称</Label>
            <Input value={settings.shopName} onChange={(e) => setSettings({ ...settings, shopName: e.target.value })} />
            <p className="text-[10px] text-muted-foreground mt-1">显示在左上角侧边栏</p>
          </div>
          <div>
            <Label className="text-muted-foreground text-xs">默认平台佣金率 (%)</Label>
            <Input type="number" step="0.1" value={settings.defaultCommissionRate === '' || settings.defaultCommissionRate == null ? '' : (settings.defaultCommissionRate * 100).toFixed(1)} onChange={(e) => setSettings({ ...settings, defaultCommissionRate: e.target.value === '' ? '' : parseFloat(e.target.value) / 100 })} />
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

      {/* Data Management */}
      <div className="mt-6 bg-card rounded-lg p-4 border border-border space-y-4">
        <h2 className="font-semibold">数据管理</h2>
        <p className="text-xs text-muted-foreground">导出整站数据（含图片）为 ZIP 文件，或从 ZIP 文件导入恢复数据。</p>
        <div className="flex gap-3">
          <Button onClick={handleExport} disabled={exporting} variant="outline">
            {exporting ? '导出中...' : '导出数据'}
          </Button>
          <Button onClick={() => fileInputRef.current?.click()} disabled={importing} variant="outline">
            {importing ? '导入中...' : '导入数据'}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".zip"
            className="hidden"
            onChange={handleImport}
          />
        </div>
      </div>
    </div>
  );
}
