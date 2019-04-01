import { axios } from '../../store';
import { bundle } from '../../helpers/coreHelpers';
import { List } from 'immutable';

/**
 * @private
 * The default number of messages retrieved per page.
 */
export const DEFAULT_MESSAGE_LIMIT = 25;

/**
 * @private
 * The default number of discussions retrieved per page.
 */
export const DEFAULT_DISCUSSION_LIMIT = 10;

const isExistingAttachment = attachment => attachment.type === 'attachment';
const baseUrl = () => `${bundle.spaceLocation()}/app/discussions`;

/**
 * Send a message to a discussion.
 *
 * @param {object} params message parameters.
 * @param {string} params.id the discussion id to send the message to.
 * @param {string} params.message message text to send.
 * @param {string} params.parentId the id of the parent message.
 * @param {array} params.attachment an array of File objects to attach.
 */
export const sendMessage = params => {
  const message = {
    content: [
      {
        type: 'text',
        value: params.message,
      },
    ],
    ...(params.parentId ? { parent: { id: params.parentId } } : {}),
  };

  if (params.attachment) {
    const formData = new FormData();
    formData.append('message', JSON.stringify(message));
    params.attachment.forEach(attachment => {
      formData.append('attachments', attachment);
    });

    axios.request({
      url: `${baseUrl()}/api/v1/discussions/${params.id}/messages`,
      method: 'post',
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      data: formData,
    });
  } else {
    return axios.request({
      url: `${baseUrl()}/api/v1/discussions/${params.id}/messages`,
      method: 'post',
      data: message,
    });
  }
};

/**
 * Update a discussion message.
 *
 * @param {object} params message parameters.
 * @param {string} params.id the message id to update.
 * @param {string} params.message message text to send.
 * @param {string} params.discussionId the discussion id to send the message to.
 * @param {array} params.attachment an array of File objects to attach.
 */
export const updateMessage = params => {
  const attachments = params.attachment || [];

  const message = {
    content: [
      {
        type: 'text',
        value: params.message,
      },
      ...attachments.filter(isExistingAttachment),
    ],
  };
  const newAttachments = attachments.filter(a => !isExistingAttachment(a));

  const formData = new FormData();
  formData.append('message', JSON.stringify(message));
  newAttachments.forEach(attachment => {
    formData.append('attachments', attachment);
  });

  axios.request({
    url: `${baseUrl()}/api/v1/discussions/${params.discussionId}/messages/${
      params.id
    }`,
    method: 'post',
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    data: formData,
  });
};

/**
 * Retrieve messages for a discussion.
 *
 * @param {string} id discussion id to retrieve messages for.
 * @param {string} pageToken next page token for paginated results.
 */
export const fetchMessages = (id, pageToken) =>
  axios
    .request({
      url: `${baseUrl()}/api/v1/discussions/${id}/messages`,
      method: 'get',
      params: {
        pageToken,
        limit: DEFAULT_MESSAGE_LIMIT,
      },
    })
    .then(response => response.data)
    .catch(response => ({ error: response }));

/**
 * Fetch a message.
 *
 * @param {object} params fetch message params.
 * @param {string} params.discussionId discussion id message belongs to
 * @param {string} params.id id of message to fetch
 */
export const fetchMessage = ({ discussionId, id }) =>
  axios
    .request({
      url: `${baseUrl()}/api/v1/discussions/${discussionId}/messages/${id}`,
      method: 'get',
    })
    .then(response => response.data)
    .catch(response => ({ error: response }));

/**
 * Fetch the history of a message for a discussion.
 *
 * @param {object} params fetch message params.
 * @param {string} params.discussionId discussion id message belongs to.
 * @param {string} params.id id of message to fetch.
 */
export const fetchMessageHistory = ({ discussionId, id }) =>
  axios
    .request({
      url: `${baseUrl()}/api/v1/discussions/${discussionId}/messages/${id}/versions`,
      method: 'get',
    })
    .then(response => response.data)
    .catch(response => ({ error: response }));

/**
 * Fetch a discussion by `id`.
 *
 * @param {object} params fetch parameters.
 * @param {string} params.id the discussion id.
 */
export const fetchDiscussion = ({ id }) =>
  axios
    .request({
      url: `${baseUrl()}/api/v1/discussions/${id}`,
      method: 'get',
    })
    .then(response => response.data)
    .catch(response => ({ error: response }));

/**
 * Fetch discussions based upon parameters.
 *
 * @param {object} params fetch parameters.
 * @param {string} params.pageToken next page token for paginated results.
 * @param {string} params.title the name of the discussion.
 * @param {object} params.relatedItem search for discussions based upon related item.
 * @param {boolean} params.isArchived flag whether discussion is archived or not.
 * @param {string} params.start params.start the date to begin the search from.
 * @param {string} params.end params.end the date to search until.
 */

export const fetchDiscussions = ({
  pageToken,
  title,
  relatedItem = {},
  isArchived,
  start,
  end,
}) => {
  const { type, key } = relatedItem;
  return axios
    .get(`${baseUrl()}/api/v1/discussions`, {
      params: {
        title: title && title.length > 0 ? title : null,
        limit: DEFAULT_DISCUSSION_LIMIT,
        type,
        key,
        pageToken,
        archived: isArchived ? true : undefined,
        start,
        end,
      },
    })
    .then(response => response.data)
    .catch(response => ({ error: response }));
};

/**
 * Start a discussion.
 *
 * @param {object} params discussion params.
 * @param {string} params.title the name of the discussion.
 * @param {string} params.description a description of the discussion.
 * @param {boolean} params.isPrivate a flag whether the discussion should be private or not
 * @param {array} params.owningUsers a list of users that own the discussion.
 * @param {array} params.owningTeams a list of teams that own the discussion.
 * @param {string} params.joinPolicy the name of the security policy that identifies who can join without an invite.
 *
 */
export const createDiscussion = ({
  title,
  description,
  isPrivate = false,
  owningUsers,
  owningTeams,
  joinPolicy,
}) =>
  axios
    .request({
      method: 'post',
      url: `${baseUrl()}/api/v1/discussions`,
      data: {
        title,
        description,
        isArchived: false,
        owningUsers,
        owningTeams,
        isPrivate,
        joinPolicy,
      },
    })
    .then(response => response.data)
    .catch(response => ({ error: response }));

export const updateDiscussion = (id, data) =>
  axios
    .request({
      method: 'put',
      url: `${baseUrl()}/api/v1/discussions/${id}`,
      data,
    })
    .then(response => response.data)
    .catch(response => ({ error: response }));

export const fetchInvites = id =>
  axios
    .request({
      url: `${baseUrl()}/api/v1/discussions/${id}/invitations`,
      method: 'get',
    })
    .then(response => response.data)
    .catch(response => ({ error: response }));

export const createInvite = ({ discussionId, type, value, message }) =>
  axios
    .request({
      url: `${baseUrl()}/api/v1/discussions/${discussionId}/invitations`,
      method: 'post',
      data:
        type === 'email'
          ? { email: value, message }
          : { user: { username: value } },
    })
    .then(response => response.data)
    .catch(response => ({ error: response }));

export const resendInvite = ({ discussionId, email, username }) =>
  axios
    .request({
      url: `${baseUrl()}/api/v1/discussions/${discussionId}/invitations/${email ||
        username}`,
      method: 'put',
      params: {
        // If we are looking up by email add an email parameter to the object
        ...(email ? { email: '' } : {}),
      },
      data: {},
    })
    .then(response => response.data)
    .catch(response => ({ error: response }));

export const removeInvite = ({ discussionId, email, username }) =>
  axios
    .request({
      url: `${baseUrl()}/api/v1/discussions/${discussionId}/invitations/${email ||
        username}`,
      method: 'delete',
      params: {
        // If we are looking up by email add an email parameter to the object
        ...(email ? { email: '' } : {}),
      },
    })
    .then(response => response.data)
    .catch(response => ({ error: response }));

export const fetchParticipants = id =>
  axios
    .request({
      url: `${baseUrl()}/api/v1/discussions/${id}/participants`,
      method: 'get',
    })
    .then(response => response.data)
    .catch(response => ({ error: response }));

export const removeParticipant = (id, username) =>
  axios
    .request({
      url: `${baseUrl()}/api/v1/discussions/${id}/participants/${username}`,
      method: 'delete',
    })
    .then(response => response.data)
    .catch(response => ({ error: response }));

export const updateParticipant = (id, username, data) =>
  axios
    .request({
      url: `${baseUrl()}/api/v1/discussions/${id}/participants/${username}`,
      method: 'put',
      data,
    })
    .then(response => response.data)
    .catch(response => ({ error: response }));

export const createRelatedItem = (id, relatedItem) =>
  axios
    .request({
      url: `${baseUrl()}/api/v1/discussions/${id}/relatedItems`,
      method: 'post',
      data: relatedItem,
    })
    .then(response => response.data)
    .catch(response => ({ error: response }));

export const sendInvites = (discussion, values) => {
  const participants = discussion.participants || List();
  const invitations = discussion.invitations || List();
  const existingUsernames = participants
    .concat(invitations)
    .filter(involvement => involvement.user)
    .map(involvement => involvement.user.username);
  const existingEmails = invitations.map(invitation => invitation.email);

  return Promise.all(
    values.invitees
      .flatMap(item => (item.team ? item.team.memberships : [item]))
      .map(item => ({
        discussionId: discussion.id,
        type: item.user ? 'username' : 'email',
        value: item.user ? item.user.username : item.label,
        message: values.message,
      }))
      .filter(args =>
        args.type === 'username'
          ? !existingUsernames.contains(args.value)
          : !existingEmails.contains(args.value),
      )
      .map(createInvite),
  );
};
