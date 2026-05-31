/** 将链上状态同步回 batch_index 表 */
import { Op } from 'sequelize';
import fiscoClient from '../src/services/fiscoClient.js';
import { BatchIndex } from '../src/models/index.js';
import * as traceService from '../src/services/traceService.js';

async function main() {
  const ids = await traceService.getAllBatchIds();
  console.log(`链上共 ${ids.length} 个批次，开始同步...`);

  let updated = 0, failed = 0, skipped = 0;
  for (const chainId of ids) {
    try {
      // 直接从链上读状态（不经过 getBatchRaw，避免 farmerStore 的 ID 解析干扰）
      const info = await fiscoClient.callReadOnly('TraceManager', 'getBatchBaseInfo', [chainId]);
      const chainState = Number(Array.isArray(info) ? info[0] : 0);

      // 查 DB：先用 chainBatchId 匹配，再用 batchId 匹配
      const row = await BatchIndex.findOne({
        where: { [Op.or]: [{ chainBatchId: chainId }, { batchId: chainId }] },
      });

      if (!row) {
        failed++;
        continue;
      }

      const dbState = Number(row.currentState ?? 0);
      if (dbState !== chainState) {
        await row.update({ currentState: chainState });
        console.log(`  ✓ ${row.batchId}: DB=${dbState} → 链=${chainState}`);
        updated++;
      } else {
        skipped++;
      }
    } catch {
      failed++;
    }
  }

  console.log(`\n同步完成: ${updated} 条更新, ${skipped} 条一致, ${failed} 条跳过`);
  process.exit(0);
}

main().catch(e => { console.error('同步失败:', e.message); process.exit(1); });
