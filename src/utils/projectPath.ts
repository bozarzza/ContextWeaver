import fs from 'node:fs';
import path from 'node:path';

/**
 * 把任意路径解析到其所属 git 仓库根。
 *
 * 背景：MCP 客户端的 agent 常把「当前工作目录」（仓库的某个子目录）当
 * repo_path 传入，导致同一仓库按子目录裂成多份索引——每份都要独立付
 * 全量重建税，且互相不可见。以 git 仓库为索引单位（与
 * getDirectoryBirthtime 优先认 .git 的口径一致）后，子目录一律归并到
 * 仓库根，一份索引全仓库共用。
 *
 * worktree 的 .git 是文件而非目录，同样视为仓库根——不同工作树内容
 * 不同，保持独立索引是正确语义。
 *
 * 找不到 .git 时原样返回（非 git 目录维持独立索引）；路径不存在时也
 * 原样返回（可能是重建中的代码库，交给调用方报错）。
 */
export function resolveProjectPath(inputPath: string): string {
  const resolved = path.resolve(inputPath);
  let current = resolved;
  try {
    if (!fs.existsSync(current)) return resolved;
    if (!fs.statSync(current).isDirectory()) current = path.dirname(current);
  } catch {
    return resolved;
  }
  while (true) {
    if (fs.existsSync(path.join(current, '.git'))) return current;
    const parent = path.dirname(current);
    if (parent === current) return resolved;
    current = parent;
  }
}
