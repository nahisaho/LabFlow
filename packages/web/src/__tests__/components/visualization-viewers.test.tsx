/**
 * Visualization Viewers Tests - Molecule and Crystal Viewers
 */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  MoleculeViewer2D,
  MoleculeGrid,
  MoleculeCompare,
} from '@/components/visualization/molecule-viewer';
import {
  CrystalViewer,
  CrystalGrid,
  LatticeInfo,
} from '@/components/visualization/crystal-viewer';
import type {
  MoleculeData,
  CrystalData,
  LatticeData,
} from '@/components/visualization/types';

// Mock ResizeObserver
vi.stubGlobal('ResizeObserver', vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
})));

describe('Molecule Viewers', () => {
  const sampleMolecule: MoleculeData = {
    id: 'caffeine',
    name: 'Caffeine',
    nameJa: 'カフェイン',
    formula: 'C8H10N4O2',
    atoms: [
      { element: 'C', x: 0, y: 0, z: 0 },
      { element: 'C', x: 1.5, y: 0, z: 0 },
      { element: 'N', x: 0.75, y: 1.2, z: 0 },
      { element: 'O', x: -1.2, y: 0.5, z: 0 },
      { element: 'H', x: 2.5, y: 0, z: 0 },
    ],
    bonds: [
      { atom1: 0, atom2: 1, order: 1 },
      { atom1: 0, atom2: 2, order: 2 },
      { atom1: 0, atom2: 3, order: 2 },
      { atom1: 1, atom2: 4, order: 1 },
    ],
    properties: {
      molecularWeight: 194.19,
      logP: -0.07,
    },
  };

  const sampleMolecule2: MoleculeData = {
    id: 'aspirin',
    name: 'Aspirin',
    formula: 'C9H8O4',
    atoms: [
      { element: 'C', x: 0, y: 0, z: 0 },
      { element: 'O', x: 1, y: 0, z: 0 },
    ],
    bonds: [{ atom1: 0, atom2: 1, order: 2 }],
  };

  describe('MoleculeViewer2D', () => {
    it('should render molecule name', () => {
      render(
        <MoleculeViewer2D
          molecule={sampleMolecule}
          config={{ showLabels: true }}
        />
      );
      expect(screen.getByText('Caffeine')).toBeDefined();
    });

    it('should render SVG with atoms', () => {
      const { container } = render(
        <MoleculeViewer2D molecule={sampleMolecule} config={{}} />
      );
      const svg = container.querySelector('svg');
      expect(svg).toBeDefined();
      // Check for circles (atoms)
      const circles = container.querySelectorAll('circle');
      expect(circles.length).toBe(5);
    });

    it('should handle rotation via mouse drag', () => {
      const { container } = render(
        <MoleculeViewer2D
          molecule={sampleMolecule}
          config={{}}
        />
      );
      const svg = container.querySelector('svg');
      expect(svg).toBeDefined();

      // Simulate drag
      fireEvent.mouseDown(svg!, { clientX: 100, clientY: 100 });
      fireEvent.mouseMove(svg!, { clientX: 150, clientY: 150 });
      fireEvent.mouseUp(svg!);
    });

    it('should handle zoom via mouse wheel', () => {
      const { container } = render(
        <MoleculeViewer2D
          molecule={sampleMolecule}
          config={{ enableZoom: true }}
        />
      );
      const svg = container.querySelector('svg');
      expect(svg).toBeDefined();

      // Simulate wheel zoom
      fireEvent.wheel(svg!, { deltaY: -100 });
    });

    it('should render style buttons', () => {
      render(
        <MoleculeViewer2D
          molecule={sampleMolecule}
          config={{}}
        />
      );
      // Style buttons in Japanese
      expect(screen.getByText('球棒')).toBeDefined();
      expect(screen.getByText('球')).toBeDefined();
      expect(screen.getByText('棒')).toBeDefined();
    });

    it('should render bonds', () => {
      const { container } = render(
        <MoleculeViewer2D
          molecule={sampleMolecule}
          config={{ showBonds: true }}
        />
      );
      const lines = container.querySelectorAll('line');
      // 4 bonds
      expect(lines.length).toBe(4);
    });
  });

  describe('MoleculeGrid', () => {
    it('should render multiple molecules', () => {
      render(
        <MoleculeGrid
          molecules={[sampleMolecule, sampleMolecule2]}
          config={{}}
          columns={2}
        />
      );
      expect(screen.getByText('Caffeine')).toBeDefined();
      expect(screen.getByText('Aspirin')).toBeDefined();
    });

    it('should handle empty array', () => {
      const { container } = render(
        <MoleculeGrid molecules={[]} config={{}} />
      );
      expect(container.firstChild).toBeDefined();
    });
  });

  describe('MoleculeCompare', () => {
    it('should render comparison view', () => {
      render(
        <MoleculeCompare
          molecules={[sampleMolecule, sampleMolecule2]}
          config={{}}
          title="Comparison"
        />
      );
      // Default title is in Japanese: "分子比較"
      expect(screen.getByText('分子比較')).toBeDefined();
      expect(screen.getByText('Caffeine')).toBeDefined();
      expect(screen.getByText('Aspirin')).toBeDefined();
    });
  });
});

describe('Crystal Viewers', () => {
  const sampleLattice: LatticeData = {
    a: 5.0,
    b: 5.0,
    c: 5.0,
    alpha: 90,
    beta: 90,
    gamma: 90,
    spaceGroup: 'Pm-3m',
  };

  const sampleCrystal: CrystalData = {
    id: 'nacl',
    name: 'Sodium Chloride',
    nameJa: '塩化ナトリウム',
    formula: 'NaCl',
    lattice: sampleLattice,
    atoms: [
      { element: 'Na', x: 0, y: 0, z: 0 },
      { element: 'Cl', x: 0.5, y: 0.5, z: 0.5 },
    ],
    properties: {
      bandGap: 8.5,
      density: 2.165,
    },
  };

  const sampleCrystal2: CrystalData = {
    id: 'diamond',
    name: 'Diamond',
    formula: 'C',
    lattice: { ...sampleLattice, a: 3.57, b: 3.57, c: 3.57, spaceGroup: 'Fd-3m' },
    atoms: [
      { element: 'C', x: 0, y: 0, z: 0 },
      { element: 'C', x: 0.25, y: 0.25, z: 0.25 },
    ],
  };

  describe('CrystalViewer', () => {
    it('should render crystal name', () => {
      render(
        <CrystalViewer
          crystal={sampleCrystal}
          config={{ showUnitCell: true }}
        />
      );
      expect(screen.getByText('Sodium Chloride')).toBeDefined();
    });

    it('should render formula', () => {
      render(<CrystalViewer crystal={sampleCrystal} config={{}} />);
      expect(screen.getByText('NaCl')).toBeDefined();
    });

    it('should render SVG', () => {
      const { container } = render(
        <CrystalViewer crystal={sampleCrystal} config={{}} />
      );
      const svg = container.querySelector('svg');
      expect(svg).toBeDefined();
    });

    it('should handle rotation via mouse drag', () => {
      const { container } = render(
        <CrystalViewer
          crystal={sampleCrystal}
          config={{}}
        />
      );
      const svg = container.querySelector('svg');
      fireEvent.mouseDown(svg!, { clientX: 100, clientY: 100 });
      fireEvent.mouseMove(svg!, { clientX: 150, clientY: 120 });
      fireEvent.mouseUp(svg!);
    });

    it('should handle zoom via mouse wheel', () => {
      const { container } = render(
        <CrystalViewer
          crystal={sampleCrystal}
          config={{ enableZoom: true }}
        />
      );
      const svg = container.querySelector('svg');
      fireEvent.wheel(svg!, { deltaY: -50 });
    });

    it('should render supercell atoms', () => {
      const { container } = render(
        <CrystalViewer
          crystal={sampleCrystal}
          config={{ supercell: [2, 2, 2] }}
        />
      );
      const circles = container.querySelectorAll('circle');
      // 2 atoms * 2*2*2 = 16 atoms
      expect(circles.length).toBe(16);
    });
  });

  describe('CrystalGrid', () => {
    it('should render multiple crystals', () => {
      render(
        <CrystalGrid
          crystals={[sampleCrystal, sampleCrystal2]}
          config={{}}
          columns={2}
        />
      );
      expect(screen.getByText('Sodium Chloride')).toBeDefined();
      expect(screen.getByText('Diamond')).toBeDefined();
    });
  });

  describe('LatticeInfo', () => {
    it('should render lattice parameters title', () => {
      render(<LatticeInfo lattice={sampleLattice} />);
      // Title is "格子パラメータ"
      expect(screen.getByText('格子パラメータ')).toBeDefined();
    });

    it('should render lattice values', () => {
      render(<LatticeInfo lattice={sampleLattice} />);
      // Check for lattice parameters a, b, c values (formatted as 5.000 Å)
      const values = screen.getAllByText(/5\.000/);
      expect(values.length).toBeGreaterThan(0);
    });

    it('should display volume', () => {
      render(<LatticeInfo lattice={sampleLattice} />);
      // Volume: 5^3 = 125 Å³ (displayed as "1.3e+2")
      expect(screen.getByText(/1\.3e\+2/)).toBeDefined();
    });
  });
});
