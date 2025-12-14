/**
 * Crystal Viewer Component
 * 
 * 結晶構造ビューアコンポーネント（2D SVGベース）
 */
'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import type {
  CrystalData,
  AtomCoordinate,
  LatticeData,
  CrystalViewerConfig,
} from './types';
import { getElementColor, formatNumber } from './utils';

// ============================================================================
// 格子ベクトル計算
// ============================================================================

interface LatticeVectors {
  a: [number, number, number];
  b: [number, number, number];
  c: [number, number, number];
}

function calculateLatticeVectors(lattice: LatticeData): LatticeVectors {
  const { a, b, c, alpha, beta, gamma } = lattice;

  // 角度をラジアンに変換
  const alphaRad = (alpha * Math.PI) / 180;
  const betaRad = (beta * Math.PI) / 180;
  const gammaRad = (gamma * Math.PI) / 180;

  // 格子ベクトルを計算
  const ax = a;
  const ay = 0;
  const az = 0;

  const bx = b * Math.cos(gammaRad);
  const by = b * Math.sin(gammaRad);
  const bz = 0;

  const cx = c * Math.cos(betaRad);
  const cy =
    c * (Math.cos(alphaRad) - Math.cos(betaRad) * Math.cos(gammaRad)) /
    Math.sin(gammaRad);
  const cz = Math.sqrt(c * c - cx * cx - cy * cy);

  return {
    a: [ax, ay, az],
    b: [bx, by, bz],
    c: [cx, cy, cz],
  };
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

function projectCrystalTo2D(
  atoms: AtomCoordinate[],
  latticeVectors: LatticeVectors,
  width: number,
  height: number,
  rotation: { x: number; y: number },
  zoom: number,
  supercell: [number, number, number] = [1, 1, 1]
): Point2D[] {
  if (atoms.length === 0) return [];

  const { a, b, c } = latticeVectors;

  // スーパーセル展開
  const expandedAtoms: AtomCoordinate[] = [];
  for (let i = 0; i < supercell[0]; i++) {
    for (let j = 0; j < supercell[1]; j++) {
      for (let k = 0; k < supercell[2]; k++) {
        atoms.forEach((atom) => {
          expandedAtoms.push({
            ...atom,
            x: atom.x + i * a[0] + j * b[0] + k * c[0],
            y: atom.y + i * a[1] + j * b[1] + k * c[1],
            z: atom.z + i * a[2] + j * b[2] + k * c[2],
          });
        });
      }
    }
  }

  // 中心を計算
  const center = {
    x: expandedAtoms.reduce((s, at) => s + at.x, 0) / expandedAtoms.length,
    y: expandedAtoms.reduce((s, at) => s + at.y, 0) / expandedAtoms.length,
    z: expandedAtoms.reduce((s, at) => s + at.z, 0) / expandedAtoms.length,
  };

  // 回転行列
  const cosX = Math.cos(rotation.x);
  const sinX = Math.sin(rotation.x);
  const cosY = Math.cos(rotation.y);
  const sinY = Math.sin(rotation.y);

  // 各原子を投影
  return expandedAtoms.map((atom) => {
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
}

// ============================================================================
// Unit Cell Lines
// ============================================================================

interface UnitCellLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

function getUnitCellLines(
  latticeVectors: LatticeVectors,
  width: number,
  height: number,
  rotation: { x: number; y: number },
  zoom: number
): UnitCellLine[] {
  const { a, b, c } = latticeVectors;

  // 8つの頂点
  const vertices = [
    [0, 0, 0],
    a,
    b,
    c,
    [a[0] + b[0], a[1] + b[1], a[2] + b[2]],
    [a[0] + c[0], a[1] + c[1], a[2] + c[2]],
    [b[0] + c[0], b[1] + c[1], b[2] + c[2]],
    [a[0] + b[0] + c[0], a[1] + b[1] + c[1], a[2] + b[2] + c[2]],
  ];

  // 中心を計算
  const center = {
    x: vertices.reduce((s, v) => s + v[0], 0) / 8,
    y: vertices.reduce((s, v) => s + v[1], 0) / 8,
    z: vertices.reduce((s, v) => s + v[2], 0) / 8,
  };

  // 回転行列
  const cosX = Math.cos(rotation.x);
  const sinX = Math.sin(rotation.x);
  const cosY = Math.cos(rotation.y);
  const sinY = Math.sin(rotation.y);

  const projectVertex = (v: number[]): { x: number; y: number } => {
    let x = v[0] - center.x;
    let y = v[1] - center.y;
    let z = v[2] - center.z;

    const x1 = x * cosY - z * sinY;
    const z1 = x * sinY + z * cosY;
    const y2 = y * cosX - z1 * sinX;
    const z2 = y * sinX + z1 * cosX;

    const perspective = 500;
    const scale = perspective / (perspective + z2);

    return {
      x: width / 2 + x1 * scale * zoom,
      y: height / 2 - y2 * scale * zoom,
    };
  };

  const projectedVertices = vertices.map(projectVertex);

  // 12本の辺
  const edges = [
    [0, 1], [0, 2], [0, 3],
    [1, 4], [1, 5],
    [2, 4], [2, 6],
    [3, 5], [3, 6],
    [4, 7], [5, 7], [6, 7],
  ];

  return edges.map(([i, j]) => ({
    x1: projectedVertices[i].x,
    y1: projectedVertices[i].y,
    x2: projectedVertices[j].x,
    y2: projectedVertices[j].y,
  }));
}

// ============================================================================
// CrystalViewer
// ============================================================================

interface CrystalViewerProps {
  crystal: CrystalData;
  config?: CrystalViewerConfig;
  width?: number;
  height?: number;
  className?: string;
}

/**
 * 結晶構造ビューアコンポーネント
 */
export function CrystalViewer({
  crystal,
  config = {},
  width = 400,
  height = 400,
  className = '',
}: CrystalViewerProps) {
  const {
    style = 'ball-stick',
    backgroundColor = '#f8fafc',
    showLabels = true,
    showUnitCell = true,
    unitCellColor = '#6366f1',
    supercell = [1, 1, 1],
    showAxes = true,
    autoRotate = false,
    rotationSpeed = 0.005,
    enableZoom = true,
  } = config;

  const svgRef = useRef<SVGSVGElement>(null);
  const [rotation, setRotation] = useState({ x: 0.5, y: 0.7 });
  const [zoom, setZoom] = useState(30);
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });

  // 格子ベクトル
  const latticeVectors = useMemo(
    () => calculateLatticeVectors(crystal.lattice),
    [crystal.lattice]
  );

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
    () =>
      projectCrystalTo2D(
        crystal.atoms,
        latticeVectors,
        width,
        height,
        rotation,
        zoom,
        supercell
      ),
    [crystal.atoms, latticeVectors, width, height, rotation, zoom, supercell]
  );

  // 単位格子の線
  const unitCellLines = useMemo(
    () => getUnitCellLines(latticeVectors, width, height, rotation, zoom),
    [latticeVectors, width, height, rotation, zoom]
  );

  // Z-sort
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
      setZoom((prev) => Math.max(10, Math.min(100, prev - e.deltaY * 0.05)));
    },
    [enableZoom]
  );

  // 原子半径
  const getAtomRadius = (element: string, scale: number) => {
    const baseRadius = 1.0;
    switch (style) {
      case 'sphere':
        return baseRadius * scale * 15;
      case 'ball-stick':
        return baseRadius * scale * 8;
      case 'stick':
        return 2;
      default:
        return baseRadius * scale * 8;
    }
  };

  return (
    <div
      className={`bg-white rounded-lg border border-gray-200 overflow-hidden ${className}`}
    >
      {/* ヘッダー */}
      <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-700">{crystal.name}</h3>
          <span className="text-xs text-gray-500">
            {crystal.formula}
            {crystal.spaceGroup && ` • ${crystal.spaceGroup}`}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>
            a={formatNumber(crystal.lattice.a, { precision: 2 })}Å
          </span>
          <span>
            b={formatNumber(crystal.lattice.b, { precision: 2 })}Å
          </span>
          <span>
            c={formatNumber(crystal.lattice.c, { precision: 2 })}Å
          </span>
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
        {/* 単位格子 */}
        {showUnitCell &&
          unitCellLines.map((line, i) => (
            <line
              key={`cell-${i}`}
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              stroke={unitCellColor}
              strokeWidth={1.5}
              strokeDasharray="4,2"
              opacity={0.6}
            />
          ))}

        {/* 座標軸 */}
        {showAxes && (
          <g>
            <line
              x1={30}
              y1={height - 30}
              x2={70}
              y2={height - 30}
              stroke="#ef4444"
              strokeWidth={2}
            />
            <text x={75} y={height - 27} fill="#ef4444" fontSize={10}>
              a
            </text>
            <line
              x1={30}
              y1={height - 30}
              x2={30}
              y2={height - 70}
              stroke="#10b981"
              strokeWidth={2}
            />
            <text x={25} y={height - 75} fill="#10b981" fontSize={10}>
              b
            </text>
            <line
              x1={30}
              y1={height - 30}
              x2={50}
              y2={height - 55}
              stroke="#3b82f6"
              strokeWidth={2}
            />
            <text x={52} y={height - 58} fill="#3b82f6" fontSize={10}>
              c
            </text>
          </g>
        )}

        {/* 原子 */}
        {sortedIndices.map((idx) => {
          const proj = projectedAtoms[idx];
          const atom = crystal.atoms[idx % crystal.atoms.length];
          const color = getElementColor(atom.element);
          const radius = getAtomRadius(atom.element, proj.scale);

          return (
            <g key={`atom-${idx}`}>
              <circle
                cx={proj.screenX}
                cy={proj.screenY}
                r={radius}
                fill={color}
                stroke="#ffffff"
                strokeWidth={1}
                className="cursor-pointer hover:opacity-80 transition-opacity"
              />
              {showLabels && radius > 6 && (
                <text
                  x={proj.screenX}
                  y={proj.screenY}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={atom.element === 'C' ? '#ffffff' : '#000000'}
                  fontSize={Math.min(10, radius * 0.7)}
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

      {/* プロパティ表示 */}
      {crystal.properties && Object.keys(crystal.properties).length > 0 && (
        <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
          <div className="flex flex-wrap gap-3 text-xs">
            {Object.entries(crystal.properties).slice(0, 5).map(([key, value]) => (
              <div key={key} className="flex gap-1">
                <span className="text-gray-500">{key}:</span>
                <span className="font-medium text-gray-700">
                  {typeof value === 'number' ? formatNumber(value, { precision: 3 }) : value}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// CrystalGrid
// ============================================================================

interface CrystalGridProps {
  crystals: CrystalData[];
  columns?: number;
  itemWidth?: number;
  itemHeight?: number;
  config?: CrystalViewerConfig;
  onSelect?: (crystal: CrystalData) => void;
}

/**
 * 結晶グリッド表示コンポーネント
 */
export function CrystalGrid({
  crystals,
  columns = 3,
  itemWidth = 250,
  itemHeight = 250,
  config,
  onSelect,
}: CrystalGridProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleSelect = (crystal: CrystalData) => {
    setSelectedId(crystal.id);
    onSelect?.(crystal);
  };

  return (
    <div
      className="grid gap-4"
      style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
    >
      {crystals.map((crystal) => (
        <div
          key={crystal.id}
          onClick={() => handleSelect(crystal)}
          className={`cursor-pointer rounded-lg border-2 transition-all ${
            selectedId === crystal.id
              ? 'border-blue-500 shadow-lg'
              : 'border-transparent hover:border-gray-300'
          }`}
        >
          <CrystalViewer
            crystal={crystal}
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
// LatticeInfo
// ============================================================================

interface LatticeInfoProps {
  lattice: LatticeData;
  className?: string;
}

/**
 * 格子情報表示コンポーネント
 */
export function LatticeInfo({ lattice, className = '' }: LatticeInfoProps) {
  const volume = useMemo(() => {
    const { a, b, c, alpha, beta, gamma } = lattice;
    const alphaRad = (alpha * Math.PI) / 180;
    const betaRad = (beta * Math.PI) / 180;
    const gammaRad = (gamma * Math.PI) / 180;

    return (
      a *
      b *
      c *
      Math.sqrt(
        1 -
          Math.cos(alphaRad) ** 2 -
          Math.cos(betaRad) ** 2 -
          Math.cos(gammaRad) ** 2 +
          2 * Math.cos(alphaRad) * Math.cos(betaRad) * Math.cos(gammaRad)
      )
    );
  }, [lattice]);

  return (
    <div className={`bg-gray-50 rounded-lg p-4 ${className}`}>
      <h4 className="text-sm font-semibold text-gray-700 mb-3">格子パラメータ</h4>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <span className="text-gray-500">a:</span>{' '}
          <span className="font-mono">{formatNumber(lattice.a, { precision: 4 })} Å</span>
        </div>
        <div>
          <span className="text-gray-500">α:</span>{' '}
          <span className="font-mono">{formatNumber(lattice.alpha, { precision: 2 })}°</span>
        </div>
        <div>
          <span className="text-gray-500">b:</span>{' '}
          <span className="font-mono">{formatNumber(lattice.b, { precision: 4 })} Å</span>
        </div>
        <div>
          <span className="text-gray-500">β:</span>{' '}
          <span className="font-mono">{formatNumber(lattice.beta, { precision: 2 })}°</span>
        </div>
        <div>
          <span className="text-gray-500">c:</span>{' '}
          <span className="font-mono">{formatNumber(lattice.c, { precision: 4 })} Å</span>
        </div>
        <div>
          <span className="text-gray-500">γ:</span>{' '}
          <span className="font-mono">{formatNumber(lattice.gamma, { precision: 2 })}°</span>
        </div>
        <div className="col-span-2 pt-2 border-t border-gray-200">
          <span className="text-gray-500">体積:</span>{' '}
          <span className="font-mono">{formatNumber(volume, { precision: 2 })} Å³</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// エクスポート
// ============================================================================

export type { CrystalViewerProps, CrystalGridProps, LatticeInfoProps };
