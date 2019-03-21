import axios from 'axios';
import { bundle } from '../../helpers/coreHelpers';

export const fetchLocales = () =>
  axios.get(`${bundle.apiLocation()}/meta/locales`);

export const fetchTimezones = () =>
  axios.get(`${bundle.apiLocation()}/meta/timezones`);
