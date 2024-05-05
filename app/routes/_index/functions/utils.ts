export function orgRound(value: number, base: number) {
  return Math.round(value * base) / base;
}

export function rankSufix(rank: number) {
  if (rank === 1) {
    return "st";
  } else if (rank === 2) {
    return "nd";
  } else if (rank === 3) {
    return "rd";
  } else {
    return "th";
  }
}

export function rankIcon(rank: number) {
  if (rank === 1) {
    return "🥇";
  } else if (rank === 2) {
    return "🥈";
  } else if (rank === 3) {
    return "🥉";
  } else {
    return " ";
  }
}
