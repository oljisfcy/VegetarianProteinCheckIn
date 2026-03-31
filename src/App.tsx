/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  History, 
  ArrowLeft, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  XCircle, 
  Download 
} from 'lucide-react';

// --- Types ---

type FoodItemType = {
  id: string;
  name: string;
  imageUrl: string;
  emoji: string;
};

type CategoryType = {
  categoryId: string;
  categoryName: string;
  items: FoodItemType[];
};

type WeekData = {
  [itemId: string]: number[]; // Array of 1-7 for Mon-Sun
};

// --- Constants ---

const FOOD_DATA: CategoryType[] = [
  {
    categoryId: 'grains',
    categoryName: '谷类',
    items: [
      { id: 'rice', name: '米', imageUrl: 'images/rice.png', emoji: '🍚' },
      { id: 'millet', name: '小米', imageUrl: 'images/millet.png', emoji: '🌾' },
      { id: 'corn', name: '玉米', imageUrl: 'images/corn.png', emoji: '🌽' },
      { id: 'oats', name: '燕麦', imageUrl: 'images/oat.png', emoji: '🥣' },
      { id: 'quinoa', name: '藜麦', imageUrl: 'images/quinoa.png', emoji: '🥗' },
    ]
  },
  {
    categoryId: 'nuts',
    categoryName: '坚果',
    items: [
      { id: 'almond', name: '杏仁', imageUrl: 'images/almond.png', emoji: '🌰' },
      { id: 'walnut', name: '核桃', imageUrl: 'images/walnut.png', emoji: '🧠' },
      { id: 'macadamia', name: '夏威夷果', imageUrl: 'images/macadamia_nut.png', emoji: '🥥' },
      { id: 'peanut', name: '花生', imageUrl: 'images/peanut.png', emoji: '🥜' },
      { id: 'cashew', name: '腰果', imageUrl: 'images/cashew.png', emoji: '🧆' },
    ]
  },
  {
    categoryId: 'beans',
    categoryName: '豆类',
    items: [
      { id: 'various_beans', name: '各式豆类', imageUrl: 'images/various_legumes.png', emoji: '🫘' },
      { id: 'green_peas', name: '青豆', imageUrl: 'images/pea.png', emoji: '🫛' },
      { id: 'green_beans', name: '豆角', imageUrl: 'images/green_beans.png', emoji: '🫛' },
      { id: 'tofu', name: '豆腐', imageUrl: 'images/tofu.png', emoji: '🧊' },
    ]
  },
  {
    categoryId: 'seeds',
    categoryName: '种子',
    items: [
      { id: 'pumpkin_seeds', name: '南瓜籽', imageUrl: 'images/pumpkin_seeds.png', emoji: '🎃' },
      { id: 'chia_seeds', name: '奇亚籽', imageUrl: 'images/chia_seeds.png', emoji: '🥄' },
      { id: 'flax_seeds', name: '亚麻籽', imageUrl: 'images/flaxseed.png', emoji: '🌾' },
      { id: 'sesame', name: '芝麻', imageUrl: 'images/sesame.png', emoji: '🥯' },
    ]
  }
];

const DAY_COLORS: Record<number, { border: string, bg: string, text: string, label: string, shortLabel: string, hex: string }> = {
  1: { border: 'border-[#f0522d]', bg: 'bg-[#f0522d]', text: 'text-white', label: '周一', shortLabel: '一', hex: '#f0522d' },
  2: { border: 'border-[#f59e31]', bg: 'bg-[#f59e31]', text: 'text-white', label: '周二', shortLabel: '二', hex: '#f59e31' },
  3: { border: 'border-[#facc15]', bg: 'bg-[#facc15]', text: 'text-white', label: '周三', shortLabel: '三', hex: '#facc15' },
  4: { border: 'border-[#84cc16]', bg: 'bg-[#84cc16]', text: 'text-white', label: '周四', shortLabel: '四', hex: '#84cc16' },
  5: { border: 'border-[#10b981]', bg: 'bg-[#10b981]', text: 'text-white', label: '周五', shortLabel: '五', hex: '#10b981' },
  6: { border: 'border-[#3b82f6]', bg: 'bg-[#3b82f6]', text: 'text-white', label: '周六', shortLabel: '六', hex: '#3b82f6' },
  7: { border: 'border-[#a855f7]', bg: 'bg-[#a855f7]', text: 'text-white', label: '周日', shortLabel: '日', hex: '#a855f7' },
};

// --- Utils ---

function useLongPress(onLongPress: () => void, onClick: () => void, ms = 500) {
  const [startLongPress, setStartLongPress] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const start = useCallback(() => {
    setStartLongPress(true);
    timerRef.current = setTimeout(() => {
      onLongPress();
      setStartLongPress(false);
    }, ms);
  }, [onLongPress, ms]);

  const stop = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      if (startLongPress) {
        onClick();
      }
    }
    setStartLongPress(false);
  }, [onClick, startLongPress]);

  return {
    onMouseDown: start,
    onMouseUp: stop,
    onMouseLeave: stop,
    onTouchStart: start,
    onTouchEnd: stop,
  };
}

function getMonday(d: Date) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(date.setDate(diff));
}

function getWeekId(d: Date) {
  const monday = getMonday(d);
  return `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
}

function formatWeekId(weekId: string) {
  const [year, month, day] = weekId.split('-').map(Number);
  const start = new Date(year, month - 1, day);
  const end = new Date(year, month - 1, day + 6);
  
  const formatDate = (d: Date) => `${d.getMonth() + 1}月${d.getDate()}日`;
  return `${formatDate(start)} - ${formatDate(end)}`;
}

// --- Components ---

function FoodItem({ item, daysRecorded, onAdd, onRemove }: { 
  item: FoodItemType; 
  daysRecorded: number[]; 
  onAdd: () => void; 
  onRemove: () => void; 
  key?: string | number;
}) {
  const hasRecords = daysRecorded.length > 0;
  const lastDay = hasRecords ? daysRecorded[daysRecorded.length - 1] : null;
  const colorInfo = lastDay ? DAY_COLORS[lastDay] : null;
  
  const longPressProps = useLongPress(
    () => {
      if (hasRecords) {
        onRemove();
      }
    },
    () => {
      onAdd();
    }
  );

  return (
    <div className="flex flex-col items-center gap-2 group select-none">
      <div 
        className="relative flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16"
        {...longPressProps}
      >
        {hasRecords && colorInfo && (
          <div
            className="absolute inset-0 rounded-full border-[3px] sm:border-[4px] shadow-sm animate-in fade-in zoom-in duration-300"
            style={{ 
              borderColor: colorInfo.hex
            }}
          />
        )}

        <div 
          className={`
            relative rounded-full flex items-center justify-center overflow-hidden z-20 shadow-md
            ${hasRecords ? 'bg-white' : 'bg-gray-100'}
            transition-all duration-300 w-11 h-11 sm:w-[52px] sm:h-[52px]
          `}
        >
          <img 
            src={item.imageUrl} 
            alt={item.name} 
            className="w-full h-full object-cover rounded-full p-0.5"
            referrerPolicy="no-referrer"
          />
        </div>

        {hasRecords && colorInfo && (
          <div 
            className="absolute -bottom-1 -right-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-sm border border-white whitespace-nowrap z-30 pointer-events-none text-white"
            style={{ backgroundColor: colorInfo.hex }}
          >
            {colorInfo.label}
          </div>
        )}
      </div>
      
      <span className={`text-[11px] sm:text-xs font-bold transition-colors text-center leading-tight ${hasRecords ? 'text-gray-900' : 'text-gray-400'}`}>
        {item.name}
        {hasRecords && daysRecorded.length > 1 && <span className="ml-0.5 text-[9px] sm:text-[10px] text-gray-400">x{daysRecorded.length}</span>}
      </span>
    </div>
  );
}

function CategoryRow({ category, weekData, onAddRecord, onRemoveRecord }: {
  category: CategoryType;
  weekData: WeekData;
  onAddRecord: (itemId: string) => void;
  onRemoveRecord: (itemId: string) => void;
  key?: string | number;
}) {
  const recordedCount = category.items.filter(item => weekData[item.id] && weekData[item.id].length > 0).length;
  const isCompleted = recordedCount >= 3;

  return (
    <div className={`
      p-4 sm:p-5 rounded-2xl border-2 transition-all duration-500
      ${isCompleted ? 'border-[#84cc16] bg-[#f7fee7] shadow-sm' : 'border-gray-100 bg-white shadow-sm'}
    `}>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-bold text-gray-800">{category.categoryName}</h3>
          {isCompleted && <CheckCircle2 className="text-[#84cc16]" size={20} />}
        </div>
        <div className={`
          text-xs sm:text-sm font-bold px-2.5 py-1 rounded-full transition-colors
          ${isCompleted ? 'bg-[#bef264] text-[#3f6212]' : 'bg-gray-100 text-gray-500'}
        `}>
          {recordedCount} / 3 种
        </div>
      </div>
      <div className="grid grid-cols-5 gap-x-1 gap-y-4 justify-items-center">
        {category.items.map(item => (
          <FoodItem 
            key={item.id} 
            item={item} 
            daysRecorded={weekData[item.id] || []} 
            onAdd={() => onAddRecord(item.id)} 
            onRemove={() => onRemoveRecord(item.id)}
          />
        ))}
      </div>
    </div>
  );
}

function HistoryCard({ weekId, weekData }: { weekId: string, weekData: WeekData, key?: string | number }) {
  const [expanded, setExpanded] = useState(false);
  
  const categoryStats = FOOD_DATA.map(cat => {
    const count = cat.items.filter(item => weekData[item.id] && weekData[item.id].length > 0).length;
    return {
      ...cat,
      count,
      completed: count >= 3
    };
  });
  
  const completedCategories = categoryStats.filter(c => c.completed).length;
  const isPerfect = completedCategories === FOOD_DATA.length;

  return (
    <div className={`
      border-2 rounded-2xl overflow-hidden transition-all duration-300
      ${isPerfect ? 'border-[#84cc16]' : 'border-gray-200'}
    `}>
      <div 
        className={`p-4 flex justify-between items-center cursor-pointer transition-colors ${isPerfect ? 'bg-[#f7fee7] hover:bg-[#ecfccb]' : 'bg-white hover:bg-gray-50'}`}
        onClick={() => setExpanded(!expanded)}
      >
        <div>
          <h4 className="font-bold text-gray-800">{formatWeekId(weekId)}</h4>
          <p className={`text-sm mt-0.5 font-medium ${isPerfect ? 'text-[#65a30d]' : 'text-gray-500'}`}>
            完成 {completedCategories} / {FOOD_DATA.length} 类
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isPerfect && (
            <div className="flex items-center gap-1 text-[#65a30d] bg-[#ecfccb] px-2 py-1 rounded-full">
              <CheckCircle2 size={16} />
              <span className="text-xs font-bold">达标</span>
            </div>
          )}
          <div className={`p-1 rounded-full ${expanded ? 'bg-gray-200' : 'bg-gray-100'}`}>
            {expanded ? <ChevronUp size={18} className="text-gray-600" /> : <ChevronDown size={18} className="text-gray-600" />}
          </div>
        </div>
      </div>
      
      {expanded && (
        <div className="p-4 bg-white border-t border-gray-100 space-y-4">
          {categoryStats.map(cat => (
            <div key={cat.categoryId} className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-sm text-gray-700">{cat.categoryName}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1
                  ${cat.completed ? 'bg-[#ecfccb] text-[#4d7c0f]' : 'bg-red-50 text-red-600'}
                `}>
                  {cat.completed ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                  {cat.completed ? '已完成' : `缺 ${3 - cat.count} 种`}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {cat.items.map(item => {
                  const days = weekData[item.id] || [];
                  const hasRecords = days.length > 0;
                  return (
                    <div 
                      key={item.id} 
                      className={`
                        text-xs px-2.5 py-1 rounded-full font-medium border flex items-center gap-1.5
                        ${hasRecords 
                          ? `bg-gray-50 text-gray-800 border-gray-200` 
                          : 'bg-transparent text-gray-300 border-gray-100'}
                      `}
                    >
                      {item.name} 
                      {hasRecords && (
                        <div className="flex gap-0.5">
                          {days.map((day, idx) => (
                            <div 
                              key={`${item.id}-day-${idx}`}
                              className={`w-2 h-2 rounded-full shadow-sm`}
                              style={{ backgroundColor: DAY_COLORS[day].hex }}
                              title={DAY_COLORS[day].label}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function HistoryView({ records, onBack }: {
  records: Record<string, WeekData>;
  onBack: () => void;
}) {
  const weeks = Object.keys(records).sort((a, b) => b.localeCompare(a));

  const handleDownload = () => {
    const dataStr = JSON.stringify(records, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `vegan-tracker-history-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <div className="max-w-md mx-auto p-4 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex flex-col gap-4 mb-6 sticky top-0 bg-[#fcfbf8]/90 backdrop-blur-md py-2 z-20">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button 
              onClick={onBack} 
              className="p-2 mr-2 rounded-full hover:bg-gray-200 transition-colors bg-gray-100"
            >
              <ArrowLeft size={20} className="text-gray-700" />
            </button>
            <h2 className="text-xl font-bold text-gray-800">历史记录</h2>
          </div>
          <button 
            onClick={handleDownload}
            className="p-2 rounded-full hover:bg-blue-50 text-blue-600 transition-colors bg-blue-50/50"
            title="下载记录"
          >
            <Download size={20} />
          </button>
        </div>
      </div>
      
      <div className="space-y-4">
        {weeks.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300">
            <p className="text-gray-500 font-medium">暂无打卡记录</p>
            <p className="text-sm text-gray-400 mt-1">开始记录你的第一周吧！</p>
          </div>
        ) : (
          weeks.map(weekId => (
            <HistoryCard key={weekId} weekId={weekId} weekData={records[weekId]} />
          ))
        )}
      </div>
    </div>
  );
}

// --- Main App ---

export default function App() {
  const [records, setRecords] = useState<Record<string, WeekData>>(() => {
    try {
      const saved = localStorage.getItem('vegan-protein-tracker');
      if (!saved) return {};
      const parsed = JSON.parse(saved);
      
      // Migration: convert old single-number format to array format
      Object.keys(parsed).forEach(weekId => {
        const weekData = parsed[weekId];
        Object.keys(weekData).forEach(itemId => {
          if (typeof weekData[itemId] === 'number') {
            weekData[itemId] = [weekData[itemId]];
          }
        });
      });
      
      return parsed;
    } catch (e) {
      return {};
    }
  });
  
  const [view, setView] = useState<'tracker' | 'history'>('tracker');
  
  const today = new Date();
  const currentWeekId = getWeekId(today);
  const currentDayOfWeek = today.getDay() === 0 ? 7 : today.getDay();
  
  useEffect(() => {
    localStorage.setItem('vegan-protein-tracker', JSON.stringify(records));
  }, [records]);

  const handleAddRecord = (itemId: string) => {
    setRecords(prev => {
      const weekData = prev[currentWeekId] || {};
      const itemRecords = weekData[itemId] || [];
      
      if (itemRecords.length >= 5) return prev;
      
      return { 
        ...prev, 
        [currentWeekId]: { 
          ...weekData, 
          [itemId]: [...itemRecords, currentDayOfWeek] 
        } 
      };
    });
  };

  const handleRemoveLastRecord = (itemId: string) => {
    setRecords(prev => {
      const weekData = prev[currentWeekId] || {};
      const itemRecords = weekData[itemId] || [];
      if (itemRecords.length === 0) return prev;
      
      const newRecords = [...itemRecords];
      newRecords.pop();
      
      const newWeekData = { ...weekData };
      if (newRecords.length === 0) {
        delete newWeekData[itemId];
      } else {
        newWeekData[itemId] = newRecords;
      }
      
      return { ...prev, [currentWeekId]: newWeekData };
    });
  };

  if (view === 'history') {
    return <HistoryView records={records} onBack={() => setView('tracker')} />;
  }

  const currentWeekData = records[currentWeekId] || {};
  
  return (
    <div 
      className="max-w-md mx-auto p-4 pb-12 animate-in fade-in duration-300 min-h-screen"
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="flex flex-col gap-4 mb-6 pt-2">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black text-gray-800 tracking-tight">素食蛋白质打卡</h1>
            <div className="mt-1 text-sm font-medium text-[#65a30d] bg-[#ecfccb] inline-block px-2.5 py-0.5 rounded-full">
              本周: {formatWeekId(currentWeekId)}
            </div>
          </div>
          <button 
            onClick={() => setView('history')}
            className="p-3 text-gray-600 bg-white shadow-sm border border-gray-100 hover:bg-gray-50 rounded-full transition-all active:scale-95"
          >
            <History size={22} />
          </button>
        </div>
      </div>
      
      <div className="space-y-5">
        {FOOD_DATA.map(category => (
          <CategoryRow 
            key={category.categoryId} 
            category={category} 
            weekData={currentWeekData} 
            onAddRecord={handleAddRecord}
            onRemoveRecord={handleRemoveLastRecord}
          />
        ))}
      </div>
    </div>
  );
}
