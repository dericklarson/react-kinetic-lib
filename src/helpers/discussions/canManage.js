export default (discussion, profile) => {
  if (!discussion) {
    return false;
  }
  if (profile.spaceAdmin) {
    return true;
  }
  if (discussion.owningUsers.map(u => u.username).includes(profile.username)) {
    return true;
  }
  const owningTeams = discussion.owningTeams.map(t => t.name);
  const profileTeams = profile.memberships.map(m => m.team.name);
  if (owningTeams.some(owningTeam => profileTeams.includes(owningTeam))) {
    return true;
  }
  return false;
};
