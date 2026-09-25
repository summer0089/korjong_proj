#!/usr/bin/env -S node
import { Migration, MigrationCLI, col, lit } from '@prisma/orm-postgres/migration';
import type { Contract as End } from '../../snapshots/60a7dc9d18bee235d9633352e835cbee0fb3a4c09cdf083f0a0435d2fe578b69/contract';
import endContract from '../../snapshots/60a7dc9d18bee235d9633352e835cbee0fb3a4c09cdf083f0a0435d2fe578b69/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/ccc132c3d05b70c9414e628e0fc97e092834e4d936e228d6b3d7dd8a0dcf9fff/contract';
import startContract from '../../snapshots/ccc132c3d05b70c9414e628e0fc97e092834e4d936e228d6b3d7dd8a0dcf9fff/contract.json' with { type: 'json' };

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'employee',
        column: col('isActive', 'bool', {
          notNull: true,
          default: lit(true),
          codecRef: { codecId: 'pg/bool@1' },
        }),
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
