import { useState } from 'react';
import { GripVertical, Trash2, Plus } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';

interface InfoRow {
  label: string;
  value: string;
}

interface DraggableInfoTableProps {
  title: string;
  data: InfoRow[];
  isEditing: boolean;
  onChange: (data: InfoRow[]) => void;
}

export function DraggableInfoTable({ title, data, isEditing, onChange }: DraggableInfoTableProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newData = [...data];
    const draggedItem = newData[draggedIndex];
    newData.splice(draggedIndex, 1);
    newData.splice(index, 0, draggedItem);
    
    onChange(newData);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleAddRow = () => {
    onChange([...data, { label: '', value: '' }]);
  };

  const handleDelete = (index: number) => {
    const newData = data.filter((_, i) => i !== index);
    onChange(newData);
  };

  const handleChange = (index: number, field: 'label' | 'value', value: string) => {
    const newData = [...data];
    newData[index] = { ...newData[index], [field]: value };
    onChange(newData);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-700">{title}</h4>
        {isEditing && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleAddRow}
            className="h-7 gap-1 text-xs"
          >
            <Plus className="h-3 w-3" />
            Thêm
          </Button>
        )}
      </div>
      
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              {isEditing && (
                <th className="w-8 px-2 py-2"></th>
              )}
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Trường
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Giá trị
              </th>
              {isEditing && (
                <th className="w-16 px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                  Xóa
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.length > 0 ? (
              data.map((row, index) => (
                <tr
                  key={index}
                  draggable={isEditing}
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`${isEditing ? 'cursor-move' : ''} hover:bg-gray-50 ${
                    draggedIndex === index ? 'opacity-50' : ''
                  }`}
                >
                  {isEditing && (
                    <td className="px-2 py-2">
                      <GripVertical className="h-4 w-4 text-gray-400" />
                    </td>
                  )}
                  <td className="px-3 py-2">
                    {isEditing ? (
                      <Input
                        value={row.label}
                        onChange={(e) => handleChange(index, 'label', e.target.value)}
                        className="h-7 text-sm"
                        placeholder="Tên trường..."
                      />
                    ) : (
                      <span className="text-sm text-gray-700">{row.label}</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {isEditing ? (
                      <Input
                        value={row.value}
                        onChange={(e) => handleChange(index, 'value', e.target.value)}
                        className="h-7 text-sm"
                        placeholder="Giá trị..."
                      />
                    ) : (
                      <span className="text-sm text-gray-900 font-medium">{row.value}</span>
                    )}
                  </td>
                  {isEditing && (
                    <td className="px-2 py-2 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(index)}
                        className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={isEditing ? 4 : 2}
                  className="px-3 py-4 text-center text-sm text-gray-400"
                >
                  {isEditing ? 'Click "Thêm" để thêm thông tin' : 'Chưa có dữ liệu'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
