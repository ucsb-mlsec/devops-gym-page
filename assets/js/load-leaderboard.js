// Tab functionality for leaderboard
let leaderboardData = {};

document.addEventListener("DOMContentLoaded", function () {
  // Load leaderboard data
  loadLeaderboardData();
});

async function loadLeaderboardData() {
  try {
    // Add cache-busting parameter to ensure fresh data
    const response = await fetch("assets/results/leaderboard.json?v=" + Date.now());
    if (!response.ok) {
      throw new Error("Failed to load results");
    }
    leaderboardData = await response.json();

    // Debug: log first result to verify data structure
    if (leaderboardData.level1 && leaderboardData.level1.length > 0) {
      console.log("Sample data:", leaderboardData.level1[0]);
    }

    // Populate each level's table
    populateTables();
  } catch (error) {
    console.error("Error loading leaderboard data:", error);
    // Show error message in all tables
    ["level1"].forEach((level) => {
      const tbody = document.getElementById(`${level}-tbody`);
      tbody.innerHTML =
        '<tr><td colspan="6" class="has-text-centered has-text-danger">Failed to load data</td></tr>';
    });
  }
}

function populateTables() {
  ["level1"].forEach((level) => {
    const results = leaderboardData[level] || [];
    populateTable(level, results);
  });
}

function populateTable(level, results) {
  const tbody = document.getElementById(`${level}-tbody`);

  if (results.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="8" class="has-text-centered">No results available</td></tr>';
    return;
  }

  // Validate and filter results to ensure they have the required fields
  const validResults = results.filter(r => {
    return r.agent && r.model && 
           typeof r.build_config === 'number' && 
           typeof r.monitoring === 'number' && 
           typeof r.issue_resolving === 'number' && 
           typeof r.test_generation === 'number';
  });

  if (validResults.length === 0) {
    console.error('No valid results found. Sample result:', results[0]);
    tbody.innerHTML =
      '<tr><td colspan="8" class="has-text-centered has-text-danger">Invalid data format</td></tr>';
    return;
  }

  // Calculate overall accuracy for each result and add it to the result object
  validResults.forEach(result => {
    result.overall = (result.build_config + result.monitoring + result.issue_resolving + result.test_generation) / 4;
  });

  // Sort by overall accuracy (descending)
  validResults.sort((a, b) => b.overall - a.overall);

  // Find best results for each category
  const bestBuildConfig = Math.max(...validResults.map(r => r.build_config));
  const bestMonitoring = Math.max(...validResults.map(r => r.monitoring));
  const bestIssueResolving = Math.max(...validResults.map(r => r.issue_resolving));
  const bestTestGeneration = Math.max(...validResults.map(r => r.test_generation));
  const bestOverall = Math.max(...validResults.map(r => r.overall));

  // Generate table rows - each result gets its own row with rank
  let html = '';
  validResults.forEach((result, index) => {
    const rank = index + 1;
    const buildConfig = Number(result.build_config).toFixed(2);
    const monitoring = Number(result.monitoring).toFixed(2);
    const issueResolving = Number(result.issue_resolving).toFixed(2);
    const testGeneration = Number(result.test_generation).toFixed(2);
    const overall = Number(result.overall).toFixed(2);

    // Add medal emoji for top 3
    let rankDisplay = rank;
    if (rank === 1) {
      rankDisplay = '🥇 ' + rank;
    } else if (rank === 2) {
      rankDisplay = '🥈 ' + rank;
    } else if (rank === 3) {
      rankDisplay = '🥉 ' + rank;
    }

    html += '<tr>';
    html += `<td>${rankDisplay}</td>`;
    html += `<td>${result.agent}</td>`;
    html += `<td>${result.model}</td>`;
    html += `<td>${result.build_config === bestBuildConfig ? '<strong>' : ''}${buildConfig}%${result.build_config === bestBuildConfig ? '</strong>' : ''}</td>`;
    html += `<td>${result.monitoring === bestMonitoring ? '<strong>' : ''}${monitoring}%${result.monitoring === bestMonitoring ? '</strong>' : ''}</td>`;
    html += `<td>${result.issue_resolving === bestIssueResolving ? '<strong>' : ''}${issueResolving}%${result.issue_resolving === bestIssueResolving ? '</strong>' : ''}</td>`;
    html += `<td>${result.test_generation === bestTestGeneration ? '<strong>' : ''}${testGeneration}%${result.test_generation === bestTestGeneration ? '</strong>' : ''}</td>`;
    html += `<td>${result.overall === bestOverall ? '<strong>' : ''}${overall}%${result.overall === bestOverall ? '</strong>' : ''}</td>`;
    html += '</tr>';
  });

  tbody.innerHTML = html;
}
