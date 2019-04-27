import { Map } from 'immutable';
import { createContext } from 'react';
import { AttributesField } from './AttributesField';
import { CheckboxField } from './CheckboxField';
import { MembershipsField } from './MembershipsField';
import { SelectField } from './SelectField';
import { TextField } from './TextField';
import { TextMultiField } from './TextMultiField';

export const DefaultFieldConfig = Map({
  attributes: AttributesField,
  checkbox: CheckboxField,
  memberships: MembershipsField,
  select: SelectField,
  text: TextField,
  'text-multi': TextMultiField,
});

export const FieldConfigContext = createContext();
