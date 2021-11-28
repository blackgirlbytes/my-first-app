const { Octokit } = require("octokit");
const octokit = new Octokit({
  auth: '******',
})
/**
 * This is the main entrypoint to your Probot app
 * @param {import('probot').Probot} app
 * 
 * 
 */

async function checkForEmployee(user) {
  let employeeStatus
  const result = await octokit.request('GET /orgs/{org}/teams/{team_slug}/memberships/{username}', {
    org: 'hydeparksda',
    team_slug: 'hp',
    username: 'derek-botany'
  }).catch(err => {
    if (err.status === 404) {
      console.log('user is not an employee')
      employeeStatus = false
    }
  });
  if (result) {
    if (result.status === 200) {
      console.log("user is employee of github", result.status);
      return true;
    }
  }
  console.log(employeeStatus)
  return employeeStatus;
}

async function addUserToTeam(user, team, employeeStatus) {
  const team_slug = employeeStatus ? 'hp' : 'test-team';
  console.log(team_slug, 'team slug');
  const result = await octokit.request('PUT /orgs/{org}/teams/{team_slug}/memberships/{username}', {
    org: 'hydeparksda',
    team_slug: team_slug,
    username: 'derek-botany',
    role: 'member'
  }).catch(err => {
    if (err.status === 403) {
      console.log(`Forbidden ${err.status}`)
    }
    if (err.status === 422) {
      console.log(`Unprocessable Entity ${err.status}`);
    }
  }
  );
  if (result) {
    if (result.status === 200) {
      console.log("user added to team", result.status);
    }
  }
}

async function openIssue(reason) {
  console.log('new')
  const result = await octokit.request('POST /repos/{owner}/{repo}/issues', {
    owner: 'blackgirlbytes',
    repo: 'my-first-app',
    title: `${reason}`,
    body: 'Should we add this user to the repo?',
  }).catch(err => {
    if (err.status === 403) {
      console.log(`Forbidden ${err.status}`)
    }
    if (err.status === 422) {
      console.log(`Unprocessable Entity ${err.status}`);
    }
  }
  );

  if (result === 201) {
    console.log("opened an issue", result);
  }
}

async function assignTeams(user) {
  console.log('here is the user', user)
  const result = await octokit.request("GET /orgs/{org}/members/{username}", {
    username: user,
    org: "hydeparksda",
  }).catch(err => {
    if (err.status === 404) {
      console.log("user is not a team member but part of the org", err.status);
      openIssue("user is not a team member but part of the org");
    }
  });

  console.log(result, 'result');
  if (result.status === 204) {
    console.log("user is part of org", result);
    const employeeStatus = await checkForEmployee(user);
    console.log(employeeStatus, 'employee status');
    addUserToTeam(user, "Maintainers", result);

  }
  if (result.status === 302) {
    console.log("user is not part of org", result);
    openIssue("user is not part of org");
  }
}


module.exports = (app) => {
  app.on("star", async (context) => {
    app.log.info(`the user is ${context.payload.sender.login}`)
    const user = context.payload.sender.login
    app.log.info('opening an issue')
    if (user) {
      await assignTeams('derek-botany')
    }
  });
};

