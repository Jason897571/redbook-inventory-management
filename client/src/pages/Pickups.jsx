import { useState, useRef, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { FileSpreadsheet, Save, Trash2 } from 'lucide-react';

const STORAGE_KEY = 'pickups-tracking-numbers';

function getDateString() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export default function Pickups() {
  const [text, setText] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || '';
    } catch {
      return '';
    }
  });
  const [savedAt, setSavedAt] = useState(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSave = () => {
    try {
      localStorage.setItem(STORAGE_KEY, text);
      setSavedAt(new Date());
    } catch {
      alert('保存失败');
    }
  };

  const handleClear = () => {
    if (!text && trackingNumbers.length === 0) return;
    if (!confirm('确定清空所有揽收单号？此操作会同时清空本地保存的内容。')) return;
    setText('');
    setSavedAt(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  const trackingNumbers = useMemo(
    () => text.split(/\r?\n/).map((s) => s.trim()).filter(Boolean),
    [text]
  );

  const generateExcel = () => {
    if (trackingNumbers.length === 0) {
      alert('请先粘贴至少一个揽收单号');
      return;
    }
    const dateStr = getDateString();
    const title = `${dateStr}揽收单`;

    const aoa = [
      [title],
      ['序号', '揽收单号'],
      ...trackingNumbers.map((num, i) => [i + 1, num]),
    ];

    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }];
    ws['!cols'] = [{ wch: 8 }, { wch: 30 }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '揽收单');

    XLSX.writeFile(wb, `LittleBeadsBeads揽收单-${dateStr}.xlsx`);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">揽收单管理</h1>
          <p className="text-sm text-muted-foreground mt-1">
            一次性粘贴多个揽收单号到下方输入框，每行一个（回车分隔），然后点击右上角生成 Excel
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSave}>
            <Save size={16} className="mr-2" />
            保存
          </Button>
          <Button variant="outline" onClick={handleClear}>
            <Trash2 size={16} className="mr-2" />
            清空
          </Button>
          <Button onClick={generateExcel}>
            <FileSpreadsheet size={16} className="mr-2" />
            生成Excel
          </Button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-6 space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">
            揽收单号（每行一个）
          </label>
          <Textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={'在此粘贴揽收单号，每行一个，例如：\nSF1234567890\nSF0987654321\n...'}
            className="font-mono text-sm min-h-[320px]"
          />
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            当前已识别{' '}
            <span className="font-semibold text-foreground">{trackingNumbers.length}</span>{' '}
            个单号
            {savedAt && (
              <span className="ml-3 text-xs">已保存于 {savedAt.toLocaleTimeString()}</span>
            )}
          </span>
          <span>日期：{getDateString()}</span>
        </div>
      </div>
    </div>
  );
}
