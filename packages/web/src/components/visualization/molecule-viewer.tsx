/**
 * Molecule Viewer Component
 * 
 * 3D分子構造ビューアコンポーネント
 * 2D SVGベースの簡易表示（3Dmol.jsなし版）
 * 
 * 注: 実際の3D表示には3Dmol.jsの追加が必要
 */
'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import type {
  MoleculeData,
  AtomCoordinate,
  MoleculeViewerConfig,
  MoleculeStyle,
} from './types';
import { getElementColor } from './utils';

// ============================================================================
// 元素プロパティ
// ============================================================================

const ELEMENT_RADII: Record<string, number> = {
  H: 0.31,
  C: 0.77,
  N: 0.71,
  O: 0.66,
  F: 0.57,
  P: 1.07,
  S: 1.05,
  Cl: 0.99,
  Br: 1.14,
  I: 1.33,
  Fe: 1.26,
  Cu: 1.28,
  Zn: 1.34,
  default: 1.0,
};

function getElementRadius(element: string): number {
  return ELEMENT_RADII[element] || ELEMENT_RADII.default;
}

// ============================================================================
// 投影計算
// ============================================================================

interface Point2D {
  x: number;
  y: number;
  z: number;
  screenX: number;
  screenY: number;
  scale: number;
}

function projectTo2D(
  atoms: AtomCoordinate[],
  width: number,
  height: number,
  rotation: { x: number; y: number },
  zoom: number
): Point2D[] {
  if (atoms.length === 0) return [];

  // 中心を計算
  const center = {
    x: atoms.reduce((s, a) => s + a.x, 0) / atoms.length,
    y: atoms.reduce((s, a) => s + a.y, 0) / atoms.length,
    z: atoms.reduce((s, a) => s + a.z, 0) / atoms.length,
  };

  // 回転行列
  const cosX = Math.cos(rotation.x);
  const sinX = Math.sin(rotation.x);
  const cosY = Math.cos(rotation.y);
  const sinY = Math.sin(rotation.y);

  // 各原子を投影
  const projected = atoms.map((atom) => {
    // 中心を原点に
    let x = atom.x - center.x;
    let y = atom.y - center.y;
    let z = atom.z - center.z;

    // Y軸回転
    const x1 = x * cosY - z * sinY;
    const z1 = x * sinY + z * cosY;

    // X軸回転
    const y2 = y * cosX - z1 * sinX;
    const z2 = y * sinX + z1 * cosX;

    // 透視投影
    const perspective = 500;
    const scale = perspective / (perspective + z2);

    return {
      x: x1,
      y: y2,
      z: z2,
      screenX: width / 2 + x1 * scale * zoom,
      screenY: height / 2 - y2 * scale * zoom,
      scale: scale * zoom,
    };
  });

  return projected;
}

// ============================================================================
// MoleculeViewer2D
// ============================================================================

interface MoleculeViewer2DProps {
  molecule: MoleculeData;
  config?: MoleculeViewerConfig;
  width?: number;
  height?: number;
  className?: string;
}

/**
 * 2D分子ビューア（SVGベース）
 */
export function MoleculeViewer2D({
  molecule,
  config = {},
  width = 400,
  height = 400,
  className = '',
}: MoleculeViewer2DProps) {
  const {
    style = 'ball-stick',
    backgroundColor = '#f8fafc',
    showLabels = true,
    showBonds = true,
    autoRotate = false,
    rotationSpeed = 0.01,
    enableZoom = true,
    enablePan = false,
  } = config;

  const svgRef = useRef<SVGSVGElement>(null);
  const [rotation, setRotation] = useState({ x: 0.3, y: 0.5 });
  const [zoom, setZoom] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });

  // 自動回転
  useEffect(() => {
    if (!autoRotate) return;

    const interval = setInterval(() => {
      setRotation((prev) => ({
        x: prev.x,
        y: prev.y + rotationSpeed,
      }));
    }, 16);

    return () => clearInterval(interval);
  }, [autoRotate, rotationSpeed]);

  // 投影計算
  const projectedAtoms = useMemo(
    () => projectTo2D(molecule.atoms, width, height, rotation, zoom),
    [molecule.atoms, width, height, rotation, zoom]
  );

  // Z-sort（奥から手前へ描画）
  const sortedIndices = useMemo(() => {
    return [...Array(projectedAtoms.length).keys()].sort(
      (a, b) => projectedAtoms[a].z - projectedAtoms[b].z
    );
  }, [projectedAtoms]);

  // マウスイベント
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    setLastMousePos({ x: e.clientX, y: e.clientY });
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return;

      const dx = e.clientX - lastMousePos.x;
      const dy = e.clientY - lastMousePos.y;

      setRotation((prev) => ({
        x: prev.x + dy * 0.01,
        y: prev.y + dx * 0.01,
      }));

      setLastMousePos({ x: e.clientX, y: e.clientY });
    },
    [isDragging, lastMousePos]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (!enableZoom) return;
      e.preventDefault();
      setZoom((prev) => Math.max(20, Math.min(200, prev - e.deltaY * 0.1)));
    },
    [enableZoom]
  );

  // 原子半径（スタイルに応じて調整）
  const getAtomRadius = (element: string, scale: number) => {
    const baseRadius = getElementRadius(element);
    switch (style) {
      case 'sphere':
        return baseRadius * scale * 20;
      case 'ball-stick':
        return baseRadius * scale * 10;
      case 'stick':
        return 3;
      default:
        return baseRadius * scale * 10;
    }
  };

  return (
    <div
      className={`bg-white rounded-lg border border-gray-200 overflow-hidden ${className}`}
    >
      {/* ヘッダー */}
      <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-700">{molecule.name}</h3>
          {molecule.smiles && (
            <span className="text-xs text-gray-500 font-mono">{molecule.smiles}</span>
          )}
        </div>
        <div className="flex gap-2">
          <ViewStyleButton
            active={style === 'ball-stick'}
            label="球棒"
            onClick={() => {}}
          />
          <ViewStyleButton
            active={style === 'sphere'}
            label="球"
            onClick={() => {}}
          />
          <ViewStyleButton
            active={style === 'stick'}
            label="棒"
            onClick={() => {}}
          />
        </div>
      </div>

      {/* 3Dビューエリア */}
      <svg
        ref={svgRef}
        width={width}
        height={height}
        style={{ backgroundColor, cursor: isDragging ? 'grabbing' : 'grab' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        {/* 結合 */}
        {showBonds &&
          molecule.bonds.map((bond, i) => {
            const atom1 = projectedAtoms[bond.atom1];
            const atom2 = projectedAtoms[bond.atom2];
            if (!atom1 || !atom2) return null;

            const strokeWidth = style === 'sphere' ? 1 : bond.order * 2;

            return (
              <line
                key={`bond-${i}`}
                x1={atom1.screenX}
                y1={atom1.screenY}
                x2={atom2.screenX}
                y2={atom2.screenY}
                stroke="#9ca3af"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
              />
            );
          })}

        {/* 原子（Z-sortされた順序で描画） */}
        {sortedIndices.map((idx) => {
          const proj = projectedAtoms[idx];
          const atom = molecule.atoms[idx];
          const color = getElementColor(atom.element);
          const radius = getAtomRadius(atom.element, proj.scale);

          return (
            <g key={`atom-${idx}`}>
              {/* 原子の球 */}
              <circle
                cx={proj.screenX}
                cy={proj.screenY}
                r={radius}
                fill={color}
                stroke="#ffffff"
                strokeWidth={1}
                className="cursor-pointer hover:opacity-80 transition-opacity"
              />
              {/* ラベル */}
              {showLabels && radius > 8 && (
                <text
                  x={proj.screenX}
                  y={proj.screenY}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={atom.element === 'C' ? '#ffffff' : '#000000'}
                  fontSize={Math.min(12, radius * 0.8)}
                  fontWeight="bold"
                  className="pointer-events-none"
                >
                  {atom.element}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* フッター（プロパティ表示） */}
      {molecule.properties && Object.keys(molecule.properties).length > 0 && (
        <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
          <div className="flex flex-wrap gap-3 text-xs">
            {Object.entries(molecule.properties).slice(0, 4).map(([key, value]) => (
              <div key={key} className="flex gap-1">
                <span className="text-gray-500">{key}:</span>
                <span className="font-medium text-gray-700">
                  {typeof value === 'number' ? value.toFixed(3) : value}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ViewStyleButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-2 py-1 text-xs rounded transition-colors ${
        active
          ? 'bg-blue-500 text-white'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      {label}
    </button>
  );
}

// ============================================================================
// MoleculeGrid
// ============================================================================

interface MoleculeGridProps {
  molecules: MoleculeData[];
  columns?: number;
  itemWidth?: number;
  itemHeight?: number;
  config?: MoleculeViewerConfig;
  onSelect?: (molecule: MoleculeData) => void;
}

/**
 * 分子グリッド表示コンポーネント
 */
export function MoleculeGrid({
  molecules,
  columns = 3,
  itemWidth = 200,
  itemHeight = 200,
  config,
  onSelect,
}: MoleculeGridProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleSelect = (molecule: MoleculeData) => {
    setSelectedId(molecule.id);
    onSelect?.(molecule);
  };

  return (
    <div
      className="grid gap-4"
      style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
    >
      {molecules.map((mol) => (
        <div
          key={mol.id}
          onClick={() => handleSelect(mol)}
          className={`cursor-pointer rounded-lg border-2 transition-all ${
            selectedId === mol.id
              ? 'border-blue-500 shadow-lg'
              : 'border-transparent hover:border-gray-300'
          }`}
        >
          <MoleculeViewer2D
            molecule={mol}
            width={itemWidth}
            height={itemHeight}
            config={{ ...config, showLabels: false }}
          />
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// MoleculeCompare
// ============================================================================

interface MoleculeCompareProps {
  molecules: [MoleculeData, MoleculeData];
  config?: MoleculeViewerConfig;
}

/**
 * 分子比較コンポーネント
 */
export function MoleculeCompare({ molecules, config }: MoleculeCompareProps) {
  const [mol1, mol2] = molecules;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">分子比較</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <MoleculeViewer2D molecule={mol1} width={300} height={300} config={config} />
        </div>
        <div>
          <MoleculeViewer2D molecule={mol2} width={300} height={300} config={config} />
        </div>
      </div>

      {/* プロパティ比較テーブル */}
      {mol1.properties && mol2.properties && (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 text-gray-600">プロパティ</th>
                <th className="text-right py-2 text-gray-600">{mol1.name}</th>
                <th className="text-right py-2 text-gray-600">{mol2.name}</th>
                <th className="text-right py-2 text-gray-600">差分</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys({ ...mol1.properties, ...mol2.properties }).map((key) => {
                const v1 = mol1.properties?.[key];
                const v2 = mol2.properties?.[key];
                const diff =
                  typeof v1 === 'number' && typeof v2 === 'number'
                    ? v2 - v1
                    : null;

                return (
                  <tr key={key} className="border-b border-gray-100">
                    <td className="py-2 text-gray-700">{key}</td>
                    <td className="py-2 text-right font-mono">
                      {typeof v1 === 'number' ? v1.toFixed(3) : v1 ?? '-'}
                    </td>
                    <td className="py-2 text-right font-mono">
                      {typeof v2 === 'number' ? v2.toFixed(3) : v2 ?? '-'}
                    </td>
                    <td
                      className={`py-2 text-right font-mono ${
                        diff !== null
                          ? diff > 0
                            ? 'text-green-600'
                            : diff < 0
                            ? 'text-red-600'
                            : 'text-gray-500'
                          : 'text-gray-400'
                      }`}
                    >
                      {diff !== null ? (diff > 0 ? '+' : '') + diff.toFixed(3) : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// エクスポート
// ============================================================================

export type { MoleculeViewer2DProps, MoleculeGridProps, MoleculeCompareProps };
