import React from 'react';
import { Provider } from 'react-redux';
import { context, commitStore, configure, store } from './store';
import './redux/meta';
import {
  DefaultFieldConfig,
  FieldConfigContext,
} from './components/core/form/FieldConfigContext';

export {
  default as ContentEditable,
} from './components/common/ContentEditable';
export { UserForm, UserList, UserDetails, CoreForm } from './components/core';
export {
  DateBanner,
  DiscussionForm,
  InvitationForm,
  Discussion,
  MessageHistory,
  UserMessageGroup,
} from './components/discussions';
export { default as partitionListBy } from './helpers/partitionListBy';
export {
  addRequestInterceptor,
  addResponseInterceptor,
  setDefaultAuthAssumed,
} from './apis/http';
export {
  createDiscussionList,
  getGroupedDiscussions,
  sortByLastMessageAt,
} from './models/discussions';
export {
  fetchDiscussions,
  createDiscussion,
  sendInvites,
  createRelatedItem,
  updateDiscussion,
  resendInvite,
  removeInvite,
  removeParticipant,
  updateParticipant,
  sendMessage,
  updateMessage,
  fetchMessage,
  fetchMessages,
  fetchMessageHistory,
  fetchDiscussion,
  fetchInvites,
  fetchParticipants,
  createInvite,
} from './apis/discussions';
export {
  // Bridged Resource exports
  bridgedResourceUrl,
  convertMultipleBridgeRecords,
  fetchBridgedResource,
  countBridgedResource,
  // Bridge Model exports
  fetchBridgeModels,
  fetchBridgeModel,
  createBridgeModel,
  updateBridgeModel,
  // Category exports
  fetchCategories,
  fetchCategory,
  createCategory,
  updateCategory,
  // Form exports
  fetchForms,
  fetchForm,
  createForm,
  updateForm,
  // Kapp exports
  fetchKapps,
  fetchKapp,
  updateKapp,
  // Membership exports
  createMembership,
  deleteMembership,
  // Profile exports
  fetchProfile,
  updateProfile,
  // Security Policy Definition exports
  fetchSecurityPolicyDefinitions,
  fetchSecurityPolicyDefinition,
  createSecurityPolicyDefinition,
  updateSecurityPolicyDefinition,
  // Space exports
  fetchSpace,
  updateSpace,
  // Submission exports
  SubmissionSearch,
  searchSubmissions,
  fetchSubmission,
  createSubmission,
  updateSubmission,
  deleteSubmission,
  // Team exports
  fetchTeams,
  fetchTeam,
  updateTeam,
  createTeam,
  deleteTeam,
  // Translations exports
  fetchAvailableLocales,
  clearTranslationsCache,
  fetchStagedTranslations,
  fetchDefaultLocale,
  setDefaultLocale,
  fetchEnabledLocales,
  enableLocale,
  disableLocale,
  fetchContexts,
  createContext,
  updateContext,
  deleteContext,
  fetchContextKeys,
  updateContextKey,
  fetchTranslations,
  upsertTranslations,
  deleteTranslations,
  // User exports
  fetchUsers,
  fetchUser,
  updateUser,
  createUser,
  deleteUser,
  // Version exports
  fetchVersion,
  // Webhook exports
  fetchWebhooks,
  fetchWebhook,
  createWebhook,
  updateWebhook,
} from './apis/core';
export { socket, socketIdentify } from './apis/socket';
export { K, bundle } from './helpers/coreHelpers';

commitStore();

const KineticLib = props => (
  <Provider store={store} context={context}>
    <FieldConfigContext.Provider
      value={DefaultFieldConfig.merge(
        props.components && props.components.fields,
      )}
    >
      {props.children}
    </FieldConfigContext.Provider>
  </Provider>
);

export { configure, KineticLib };
