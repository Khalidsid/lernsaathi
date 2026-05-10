#!/usr/bin/env node
import fs from 'fs'
import path from 'path'

/**
 * Evidence collection helper for manual validation matrices.
 *
 * Usage:
 *   node scripts/collect-evidence.mjs init <slice-brief-path>
 *   node scripts/collect-evidence.mjs mark <flow> <browser> <status>
 *   node scripts/collect-evidence.mjs status
 *   node scripts/collect-evidence.mjs report
 *
 * Example:
 *   node scripts/collect-evidence.mjs init docs/slices/SLICE_3_13_BRIEF.md
 *   node scripts/collect-evidence.mjs mark login chrome pass
 *   node scripts/collect-evidence.mjs mark login safari fail "Button not visible"
 *   node scripts/collect-evidence.mjs status
 *   node scripts/collect-evidence.mjs report > docs/releases/SLICE_3_13_EVIDENCE.md
 */

const EVIDENCE_FILE = '.evidence-matrix.json'

function initializeMatrix(briefPath) {
  if (!fs.existsSync(briefPath)) {
    throw new Error(`Brief not found: ${briefPath}`)
  }

  const content = fs.readFileSync(briefPath, 'utf-8')

  // Extract evidence matrix section
  const matrixMatch = content.match(
    /## Evidence Matrix[\s\S]*?(?=##|$)/
  )

  if (!matrixMatch) {
    console.warn('⚠️  No evidence matrix found in brief. Creating default matrix.')
  }

  // Default matrix structure
  const matrix = {
    slice: briefPath,
    startedAt: new Date().toISOString(),
    flows: {
      login: {},
      signup: {},
      chat: {},
      revision: {},
      logout: {}
    },
    browsers: ['chrome', 'safari', 'ios', 'android'],
    checks: ['keyboard', 'screenReader']
  }

  fs.writeFileSync(EVIDENCE_FILE, JSON.stringify(matrix, null, 2))
  console.log(`✅ Evidence matrix initialized for ${briefPath}`)
  console.log(`   File: ${EVIDENCE_FILE}`)
  console.log(`   Flows: ${Object.keys(matrix.flows).join(', ')}`)
  console.log(`   Browsers: ${matrix.browsers.join(', ')}`)
  console.log(`   Accessibility: ${matrix.checks.join(', ')}`)
}

function loadMatrix() {
  if (!fs.existsSync(EVIDENCE_FILE)) {
    throw new Error(
      `Evidence matrix not initialized. Run:\n  node scripts/collect-evidence.mjs init <brief-path>`
    )
  }

  return JSON.parse(fs.readFileSync(EVIDENCE_FILE, 'utf-8'))
}

function saveMatrix(matrix) {
  fs.writeFileSync(EVIDENCE_FILE, JSON.stringify(matrix, null, 2))
}

function markEvidence(flow, target, status, note = '') {
  const matrix = loadMatrix()

  if (!matrix.flows[flow]) {
    throw new Error(`Unknown flow: ${flow}. Available: ${Object.keys(matrix.flows).join(', ')}`)
  }

  // Normalize status
  const normalizedStatus = status.toLowerCase()
  if (!['pass', 'fail', 'pending', 'skip'].includes(normalizedStatus)) {
    throw new Error(`Invalid status: ${status}. Use: pass, fail, pending, skip`)
  }

  // Mark the cell
  matrix.flows[flow][target] = {
    status: normalizedStatus,
    note: note || '',
    timestamp: new Date().toISOString()
  }

  saveMatrix(matrix)

  const emoji = {
    pass: '✅',
    fail: '❌',
    pending: '⏳',
    skip: '⏭️'
  }[normalizedStatus]

  console.log(`${emoji} ${flow} / ${target}: ${normalizedStatus}`)
  if (note) {
    console.log(`   Note: ${note}`)
  }
}

function showStatus() {
  const matrix = loadMatrix()

  console.log('\n📊 Evidence Collection Status\n')
  console.log(`Slice: ${matrix.slice}`)
  console.log(`Started: ${new Date(matrix.startedAt).toLocaleString()}\n`)

  let totalCells = 0
  let completedCells = 0
  let passedCells = 0
  let failedCells = 0

  const allTargets = [...matrix.browsers, ...matrix.checks]

  for (const [flow, results] of Object.entries(matrix.flows)) {
    console.log(`${flow}:`)

    for (const target of allTargets) {
      totalCells++
      const result = results[target]

      if (result) {
        const emoji = {
          pass: '✅',
          fail: '❌',
          pending: '⏳',
          skip: '⏭️'
        }[result.status]

        console.log(`  ${emoji} ${target}: ${result.status}`)
        if (result.note) {
          console.log(`     └─ ${result.note}`)
        }

        if (result.status !== 'pending') completedCells++
        if (result.status === 'pass') passedCells++
        if (result.status === 'fail') failedCells++
      } else {
        console.log(`  ⬜ ${target}: not tested`)
      }
    }
    console.log()
  }

  const completionPercent = Math.round((completedCells / totalCells) * 100)
  const passRate = completedCells > 0
    ? Math.round((passedCells / completedCells) * 100)
    : 0

  console.log('Summary:')
  console.log(`  Total cells: ${totalCells}`)
  console.log(`  Completed: ${completedCells}/${totalCells} (${completionPercent}%)`)
  console.log(`  Pass rate: ${passedCells}/${completedCells} (${passRate}%)`)
  console.log(`  Failures: ${failedCells}`)
  console.log()

  if (completedCells < totalCells) {
    console.log('⚠️  Evidence collection incomplete')
  } else if (failedCells > 0) {
    console.log('❌ Evidence collection complete with failures')
  } else {
    console.log('✅ Evidence collection complete - all tests passed!')
  }
}

function generateReport() {
  const matrix = loadMatrix()

  console.log(`# Evidence Report: ${path.basename(matrix.slice, '.md')}`)
  console.log()
  console.log(`**Collection started:** ${new Date(matrix.startedAt).toLocaleDateString()}`)
  console.log(`**Collection completed:** ${new Date().toLocaleDateString()}`)
  console.log()
  console.log('## Manual Validation Matrix')
  console.log()

  // Generate markdown table
  const allTargets = [...matrix.browsers, ...matrix.checks]
  const header = ['Flow', ...allTargets].join(' | ')
  const separator = ['---', ...allTargets.map(() => '---')].join(' | ')

  console.log(header)
  console.log(separator)

  for (const [flow, results] of Object.entries(matrix.flows)) {
    const cells = allTargets.map(target => {
      const result = results[target]
      if (!result) return '⬜ not tested'

      const emoji = {
        pass: '✅',
        fail: '❌',
        pending: '⏳',
        skip: '⏭️'
      }[result.status]

      return `${emoji} ${result.status}`
    })

    console.log([flow, ...cells].join(' | '))
  }

  console.log()
  console.log('## Issues Found')
  console.log()

  let issueCount = 0
  for (const [flow, results] of Object.entries(matrix.flows)) {
    for (const [target, result] of Object.entries(results)) {
      if (result.status === 'fail') {
        issueCount++
        console.log(`${issueCount}. **${flow} / ${target}:** ${result.note || 'No details provided'}`)
      }
    }
  }

  if (issueCount === 0) {
    console.log('✅ No issues found')
  }

  console.log()
  console.log('## Screenshots')
  console.log()
  console.log('*(Add screenshot paths here)*')
  console.log()
  console.log('## Summary')
  console.log()

  let totalCells = 0
  let completedCells = 0
  let passedCells = 0
  let failedCells = 0

  for (const results of Object.values(matrix.flows)) {
    for (const target of allTargets) {
      totalCells++
      const result = results[target]
      if (result && result.status !== 'pending') completedCells++
      if (result && result.status === 'pass') passedCells++
      if (result && result.status === 'fail') failedCells++
    }
  }

  console.log(`- Total test cells: ${totalCells}`)
  console.log(`- Completed: ${completedCells}/${totalCells}`)
  console.log(`- Pass rate: ${passedCells}/${completedCells}`)
  console.log(`- Failures: ${failedCells}`)
  console.log()

  if (failedCells > 0) {
    console.log('❌ **Evidence validation failed**')
  } else if (completedCells < totalCells) {
    console.log('⚠️  **Evidence collection incomplete**')
  } else {
    console.log('✅ **Evidence validation passed**')
  }
}

// Main execution
const [command, ...args] = process.argv.slice(2)

try {
  switch (command) {
    case 'init': {
      const briefPath = args[0]
      if (!briefPath) {
        throw new Error('Usage: node scripts/collect-evidence.mjs init <brief-path>')
      }
      initializeMatrix(briefPath)
      break
    }

    case 'mark': {
      const [flow, target, status, ...noteParts] = args
      if (!flow || !target || !status) {
        throw new Error(
          'Usage: node scripts/collect-evidence.mjs mark <flow> <target> <status> [note]'
        )
      }
      const note = noteParts.join(' ')
      markEvidence(flow, target, status, note)
      break
    }

    case 'status': {
      showStatus()
      break
    }

    case 'report': {
      generateReport()
      break
    }

    default:
      console.log('Evidence Collection Helper')
      console.log()
      console.log('Commands:')
      console.log('  init <brief-path>              Initialize evidence matrix')
      console.log('  mark <flow> <target> <status>  Mark a test cell (status: pass/fail/pending/skip)')
      console.log('  status                         Show current progress')
      console.log('  report                         Generate markdown report')
      console.log()
      console.log('Example workflow:')
      console.log('  node scripts/collect-evidence.mjs init docs/slices/SLICE_3_13_BRIEF.md')
      console.log('  node scripts/collect-evidence.mjs mark login chrome pass')
      console.log('  node scripts/collect-evidence.mjs mark login safari fail "Menu not visible"')
      console.log('  node scripts/collect-evidence.mjs status')
      console.log('  node scripts/collect-evidence.mjs report > docs/releases/EVIDENCE.md')
      process.exit(command ? 1 : 0)
  }
} catch (error) {
  console.error('Error:', error.message)
  process.exit(1)
}
