#!/usr/bin/env node
import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

/**
 * Validates git changes against slice brief constraint card.
 *
 * Usage: node scripts/validate-constraints.mjs [slice-brief-path]
 * Example: node scripts/validate-constraints.mjs docs/slices/SLICE_3_10_BRIEF.md
 */

function parseConstraintCard(briefPath) {
  const content = fs.readFileSync(briefPath, 'utf-8')

  // Extract constraint card section
  const cardMatch = content.match(
    /## 1\.5\. ⚠️ CONSTRAINT CARD[\s\S]*?---/
  )

  if (!cardMatch) {
    throw new Error(`No constraint card found in ${briefPath}`)
  }

  const cardText = cardMatch[0]

  // Parse allowed files
  const allowedMatch = cardText.match(
    /\*\*Allowed files.*?\*\*:\s*([\s\S]*?)(?=\*\*Forbidden|$)/
  )
  const allowedFiles = allowedMatch
    ? allowedMatch[1]
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.startsWith('-'))
        .map(line => line.replace(/^-\s*`?([^`\s(]+).*/, '$1'))
    : []

  // Parse forbidden patterns
  const forbiddenMatch = cardText.match(
    /\*\*Forbidden areas.*?\*\*:\s*([\s\S]*?)(?=\*\*Expected|$)/
  )
  const forbiddenPatterns = forbiddenMatch
    ? forbiddenMatch[1]
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.startsWith('-'))
        .map(line => line.replace(/^-\s*`?([^`\s(]+).*/, '$1'))
    : []

  // Parse expected git diff
  const diffMatch = cardText.match(/```\n([\s\S]*?)```/)
  const expectedDiff = diffMatch
    ? diffMatch[1]
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.match(/^[MAD]\s+/))
        .map(line => {
          const [status, ...pathParts] = line.split(/\s+/)
          return { status, path: pathParts.join(' ') }
        })
    : []

  return { allowedFiles, forbiddenPatterns, expectedDiff }
}

function getGitStatus() {
  const output = execSync('git status --short', { encoding: 'utf-8' })
  return output
    .split('\n')
    .filter(line => line.trim())
    .map(line => {
      const match = line.match(/^(.{2})\s+(.+)$/)
      if (!match) return null

      const [, statusCode, filePath] = match
      const status = statusCode.trim().charAt(0)

      // Map git status codes to M/A/D
      let normalizedStatus = status
      if (status === '?' || status === 'A') normalizedStatus = 'A'
      else if (status === 'M' || status === 'R') normalizedStatus = 'M'
      else if (status === 'D') normalizedStatus = 'D'

      return { status: normalizedStatus, path: filePath }
    })
    .filter(Boolean)
}

function matchesPattern(filePath, pattern) {
  // Simple glob matching
  const regexPattern = pattern
    .replace(/\./g, '\\.')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.')

  return new RegExp(`^${regexPattern}$`).test(filePath)
}

function validateConstraints(briefPath) {
  const constraints = parseConstraintCard(briefPath)
  const currentStatus = getGitStatus()

  const violations = []
  const warnings = []

  // Check each changed file
  for (const { status, path: filePath } of currentStatus) {
    // Check if file is forbidden
    const isForbidden = constraints.forbiddenPatterns.some(pattern =>
      matchesPattern(filePath, pattern)
    )

    if (isForbidden) {
      violations.push(`❌ FORBIDDEN: ${filePath} matches forbidden pattern`)
      continue
    }

    // Check if file is allowed
    const isAllowed = constraints.allowedFiles.some(allowedPath =>
      filePath === allowedPath ||
      matchesPattern(filePath, allowedPath) ||
      allowedPath.endsWith('(new)') && matchesPattern(filePath, allowedPath.replace(/\s*\(new\)/, ''))
    )

    if (!isAllowed) {
      warnings.push(`⚠️  UNEXPECTED: ${filePath} not in allowed files list`)
    }
  }

  // Compare with expected diff
  if (constraints.expectedDiff.length > 0) {
    const currentPaths = new Set(currentStatus.map(s => s.path))
    const expectedPaths = new Set(constraints.expectedDiff.map(d => d.path))

    // Check for missing expected changes
    for (const expected of constraints.expectedDiff) {
      if (!currentPaths.has(expected.path)) {
        warnings.push(`⚠️  MISSING: Expected change to ${expected.path}`)
      }
    }
  }

  return { violations, warnings, currentStatus, constraints }
}

// Main execution
const briefPath = process.argv[2] || 'docs/slices/SLICE_3_10_BRIEF.md'

try {
  const result = validateConstraints(briefPath)

  console.log('\n📋 Constraint Card Validation\n')
  console.log(`Brief: ${briefPath}\n`)

  console.log('Current changes:')
  if (result.currentStatus.length === 0) {
    console.log('  (no changes)')
  } else {
    for (const { status, path } of result.currentStatus) {
      console.log(`  ${status} ${path}`)
    }
  }
  console.log()

  if (result.violations.length > 0) {
    console.log('🚨 VIOLATIONS (MUST FIX):')
    result.violations.forEach(v => console.log(`  ${v}`))
    console.log()
  }

  if (result.warnings.length > 0) {
    console.log('⚠️  WARNINGS (REVIEW):')
    result.warnings.forEach(w => console.log(`  ${w}`))
    console.log()
  }

  if (result.violations.length === 0 && result.warnings.length === 0) {
    console.log('✅ All constraint checks passed!\n')
    process.exit(0)
  } else if (result.violations.length > 0) {
    console.log('❌ Constraint violations detected. Fix before committing.\n')
    process.exit(1)
  } else {
    console.log('⚠️  Warnings present. Review before committing.\n')
    process.exit(0) // Warnings don't block
  }
} catch (error) {
  console.error('Error validating constraints:', error.message)
  process.exit(1)
}
