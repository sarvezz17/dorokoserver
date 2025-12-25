function evaluateTeam(teamPlayers, purseLeft) {
  let score = 0;

  const roles = { bat:0, bowl:0, ar:0, wk:0 };

  teamPlayers.forEach(p => {
    score += p.rating;
    if (p.role === "BAT") roles.bat++;
    if (p.role === "BOWL") roles.bowl++;
    if (p.role === "AR") roles.ar++;
    if (p.role === "WK") roles.wk++;
  });

  // Balance bonus
  score += Math.min(roles.bat,2) * 5;
  score += Math.min(roles.bowl,2) * 5;
  score += Math.min(roles.ar,1) * 5;
  score += roles.wk >= 1 ? 5 : 0;

  // Purse efficiency
  score += purseLeft * 0.3;

  return score;
}

module.exports = { evaluateTeam };
