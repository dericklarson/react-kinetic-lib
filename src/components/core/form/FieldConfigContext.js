import { Map } from 'immutable';
import { createContext } from 'react';
import { AttributesField } from './AttributesField';
import { CheckboxField } from './CheckboxField';
import { TeamsField } from './TeamsField';
import { SelectField } from './SelectField';
import { TextField } from './TextField';
import { TextMultiField } from './TextMultiField';

export const DefaultFieldConfig = Map({
  attributes: AttributesField,
  checkbox: CheckboxField,
  teams: TeamsField,
  select: SelectField,
  text: TextField,
  'text-multi': TextMultiField,
});

export const FieldConfigContext = createContext();
