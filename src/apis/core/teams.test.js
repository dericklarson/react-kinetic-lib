import axios from 'axios';

import {
  fetchTeam,
  fetchTeams,
  updateTeam,
  createTeam,
  deleteTeam,
} from './teams';
import { TeamBuilder } from '../../../tests/utils/team_builder';
import {
  rejectPromiseWith,
  resolvePromiseWith,
} from '../../../tests/utils/promises';

// Mock out the bundle object from a dependency.
jest.mock('../../helpers/coreHelpers', () => ({
  bundle: {
    apiLocation: () => 'team/app/api/v1',
    kappSlug: () => 'mock-kapp',
  },
}));

describe('teams api', () => {
  describe('#fetchTeams', () => {
    describe('when successful', () => {
      let response;
      let testTeam;

      beforeEach(() => {
        response = {
          status: 200,
          data: {
            teams: [],
          },
        };
        testTeam = new TeamBuilder()
          .stub()
          .withAttribute('Attribute', 'value')
          .build();
        response.data.teams.push(testTeam);
        axios.get = resolvePromiseWith(response);
      });

      test('does not return errors', () => {
        expect.assertions(1);
        return fetchTeams().then(({ serverError }) => {
          expect(serverError).toBeUndefined();
        });
      });

      test('returns an array of teams', () => {
        expect.assertions(2);
        return fetchTeams().then(({ teams }) => {
          expect(teams).toBeInstanceOf(Array);
          expect(teams[0]).toMatchObject({
            name: testTeam.name,
            slug: testTeam.slug,
          });
        });
      });

      test('translates attributes', () => {
        expect.assertions(2);
        return fetchTeams().then(({ teams }) => {
          expect(teams[0].attributes).toBeDefined();
          expect(teams[0].attributes).not.toBeInstanceOf(Array);
        });
      });
    });
  });

  describe('#fetchTeam', () => {
    describe('when successful', () => {
      let response;
      let testTeam;
      let teamSlug;

      beforeEach(() => {
        response = {
          status: 200,
          data: {
            team: {},
          },
        };
        testTeam = new TeamBuilder()
          .stub()
          .withAttribute('Attribute', 'value')
          .build();
        teamSlug = testTeam.slug;
        response.data.team = testTeam;
        axios.get = resolvePromiseWith(response);
      });

      test('does not return errors', () => {
        expect.assertions(1);
        return fetchTeam({ teamSlug }).then(({ errors }) => {
          expect(errors).toBeUndefined();
        });
      });

      test('returns a team', () => {
        expect.assertions(1);
        return fetchTeam({ teamSlug }).then(({ team }) => {
          expect(team).toMatchObject({
            name: testTeam.name,
            slug: testTeam.slug,
          });
        });
      });

      test('translates attributes', () => {
        expect.assertions(2);
        return fetchTeam({ teamSlug, xlatAttributes: true }).then(
          ({ team }) => {
            expect(team.attributes).toBeDefined();
            expect(team.attributes).not.toBeInstanceOf(Array);
          },
        );
      });
    });

    describe('when unsuccessful', () => {
      let response;

      beforeEach(() => {
        response = {
          status: 500,
        };
        axios.get = rejectPromiseWith({ response });
      });

      test('throws an exception when no team slug is provided', () => {
        expect(() => {
          fetchTeam({});
        }).toThrow();
      });

      test('does return errors', () => {
        expect.assertions(1);
        return fetchTeam({ teamSlug: 'fake', xlatAttributes: true }).then(
          ({ serverError }) => {
            expect(serverError).toBeDefined();
          },
        );
      });
    });
  });

  describe('#updateTeam', () => {
    describe('when successful', () => {
      let response;
      let testTeam;
      let teamSlug;

      beforeEach(() => {
        response = {
          status: 200,
          data: {
            team: {},
          },
        };
        testTeam = new TeamBuilder()
          .stub()
          .withAttribute('Attribute', 'value')
          .build();
        teamSlug = testTeam.slug;
        response.data.team = testTeam;
        axios.put = resolvePromiseWith(response);
      });

      test('does not return errors', () => {
        expect.assertions(1);
        return updateTeam({ teamSlug, team: testTeam }).then(({ errors }) => {
          expect(errors).toBeUndefined();
        });
      });

      test('returns a team', () => {
        expect.assertions(1);
        return updateTeam({ teamSlug, team: testTeam }).then(({ team }) => {
          expect(team).toMatchObject({
            slug: testTeam.slug,
            name: testTeam.name,
          });
        });
      });

      test('translates attributes', () => {
        expect.assertions(2);
        return updateTeam({ teamSlug, team: testTeam }).then(({ team }) => {
          expect(team.attributes).toBeDefined();
          expect(team.attributes).not.toBeInstanceOf(Array);
        });
      });
    });

    describe('when unsuccessful', () => {
      let response;

      beforeEach(() => {
        response = {
          status: 500,
        };
        axios.put = rejectPromiseWith({ response });
      });

      test('throws an exception when no team slug is provided', () => {
        expect(() => {
          updateTeam({ team: {} });
        }).toThrow();
      });

      test('throws an uxception when no team object is provided', () => {
        expect(() => {
          updateTeam({ teamSlug: 'fake' });
        }).toThrow();
      });

      test('does return errors', () => {
        expect.assertions(1);
        return updateTeam({ teamSlug: 'fake', team: {} }).then(
          ({ serverError }) => {
            expect(serverError).toBeDefined();
          },
        );
      });
    });
  });

  describe('#createTeam', () => {
    describe('when successful', () => {
      let response;
      let testTeam;

      beforeEach(() => {
        response = {
          status: 200,
          data: {
            team: {},
          },
        };
        testTeam = new TeamBuilder()
          .stub()
          .withAttribute('Attribute', 'value')
          .build();
        response.data.team = testTeam;
        axios.post = resolvePromiseWith(response);
      });

      test('does not return errors', () => {
        expect.assertions(1);
        return createTeam({ team: testTeam }).then(({ errors }) => {
          expect(errors).toBeUndefined();
        });
      });

      test('returns a team', () => {
        expect.assertions(1);
        return createTeam({ team: testTeam }).then(({ team }) => {
          expect(team).toMatchObject({
            slug: testTeam.slug,
            name: testTeam.name,
          });
        });
      });

      test('translates attributes', () => {
        expect.assertions(2);
        return createTeam({ team: testTeam }).then(({ team }) => {
          expect(team.attributes).toBeDefined();
          expect(team.attributes).not.toBeInstanceOf(Array);
        });
      });
    });

    describe('when unsuccessful', () => {
      let response;

      beforeEach(() => {
        response = {
          status: 500,
        };
        axios.post = rejectPromiseWith({ response });
      });

      test('throws an exception when no team object is provided', () => {
        expect(() => {
          createTeam({});
        }).toThrow();
      });

      test('does return errors', () => {
        expect.assertions(1);
        return createTeam({ team: {} }).then(({ serverError }) => {
          expect(serverError).toBeDefined();
        });
      });
    });
  });

  describe('#deleteTeam', () => {
    describe('when successful', () => {
      let response;
      const teamSlug = 'testteam';

      beforeEach(() => {
        response = {
          status: 200,
          data: {},
        };
        axios.delete = resolvePromiseWith(response);
      });

      test('does not return errors', () => {
        expect.assertions(1);
        return deleteTeam({ teamSlug }).then(({ errors }) => {
          expect(errors).toBeUndefined();
        });
      });
    });

    describe('when unsuccessful', () => {
      let response;

      beforeEach(() => {
        response = {
          status: 500,
        };
        axios.delete = rejectPromiseWith({ response });
      });

      test('throws an exception when no teamSlug is provided', () => {
        expect(() => {
          deleteTeam({});
        }).toThrow();
      });

      test('does return errors', () => {
        expect.assertions(1);
        return deleteTeam({ teamSlug: 'fake' }).then(({ serverError }) => {
          expect(serverError).toBeDefined();
        });
      });
    });
  });
});
