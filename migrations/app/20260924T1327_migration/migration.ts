#!/usr/bin/env -S node
import {
  Migration,
  MigrationCLI,
  checkExpression,
  col,
  fn,
  lit,
  primaryKey,
} from '@prisma/orm-postgres/migration';
import type { Contract as Start } from '../../snapshots/1e8412e162dbbe69f4bb3bf8d07f0280ae67eaab15c34dcf201e67468315428d/contract';
import startContract from '../../snapshots/1e8412e162dbbe69f4bb3bf8d07f0280ae67eaab15c34dcf201e67468315428d/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/ccc132c3d05b70c9414e628e0fc97e092834e4d936e228d6b3d7dd8a0dcf9fff/contract';
import endContract from '../../snapshots/ccc132c3d05b70c9414e628e0fc97e092834e4d936e228d6b3d7dd8a0dcf9fff/contract.json' with { type: 'json' };

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.dropTable({ schema: 'public', table: 'post' }),
      this.dropTable({ schema: 'public', table: 'user' }),
      this.createTable({
        schema: 'public',
        table: 'department',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'employee',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('department', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('departmentId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('email', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('firstname', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('lastname', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('password', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('phoneNumber', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('position', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('profileImage', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('role', 'text', {
            notNull: true,
            default: lit('USER'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'employee_role_check_32be53da',
            "\"role\" IN ('ADMIN', 'APPROVER', 'USER')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'meetingBooking',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('employeeId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('endTime', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('note', 'text', {
            notNull: true,
            default: lit(''),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('participant', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('roomId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('startTime', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('status', 'text', {
            notNull: true,
            default: lit('PENDING'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('topic', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'meetingBooking_status_check_0b6f21cd',
            "\"status\" IN ('PENDING', 'APPROVED', 'CANCELED', 'REJECTED')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'meetingRoom',
        columns: [
          col('capacity', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addUnique({
        schema: 'public',
        table: 'department',
        constraint: 'department_name_key',
        columns: ['name'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'employee',
        constraint: 'employee_email_key',
        columns: ['email'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'meetingRoom',
        constraint: 'meetingRoom_name_key',
        columns: ['name'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'employee',
        index: 'employee_departmentId_idx_8e261ed8',
        columns: ['departmentId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'meetingBooking',
        index: 'meetingBooking_employeeId_idx_087dd4a6',
        columns: ['employeeId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'meetingBooking',
        index: 'meetingBooking_roomId_idx_fe51d647',
        columns: ['roomId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'employee',
        foreignKey: {
          name: 'employee_departmentId_fkey',
          columns: ['departmentId'],
          references: { schema: 'public', table: 'department', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'meetingBooking',
        foreignKey: {
          name: 'meetingBooking_employeeId_fkey',
          columns: ['employeeId'],
          references: { schema: 'public', table: 'employee', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'meetingBooking',
        foreignKey: {
          name: 'meetingBooking_roomId_fkey',
          columns: ['roomId'],
          references: { schema: 'public', table: 'meetingRoom', columns: ['id'] },
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
