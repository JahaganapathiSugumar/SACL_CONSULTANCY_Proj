import { apiService } from './commonService';
import { masterCardSchema } from '../schemas/masterCard';

import { validate } from '../utils';

export const masterListService = {
  submitMasterListJson(payload: Record<string, unknown>) {
    const validatedData = validate(masterCardSchema, payload);
    return apiService.request('/master-list', {
      method: 'POST',
      body: JSON.stringify(validatedData),
    });
  },

  submitMasterList(payload: Record<string, unknown>, isEdit: boolean = false, id: number | string | null = null) {
    const validatedData = validate(masterCardSchema, payload);
    return apiService.request(isEdit ? `/master-list/${id}` : '/master-list', {
      method: isEdit ? 'PUT' : 'POST',
      body: JSON.stringify(validatedData),
    });
  },
  submitMasterListFormData(payload: Record<string, unknown>) {
      return this.submitMasterList(payload);
  },

  getAllMasterLists() {
    return apiService.request('/master-list', {
      method: 'GET'
    });
  },

  updateMasterList(id: string | number, payload: Record<string, unknown>) {
    const validatedData = validate(masterCardSchema.partial(), payload);
    return apiService.request(`/master-list/${id}`, {
      method: 'PUT',
      body: JSON.stringify(validatedData)
    });
  },

  deleteMasterLists(ids: number[]) {
    return apiService.request('/master-list/bulk', {
      method: 'DELETE',
      body: JSON.stringify({ ids })
    });
  },

  toggleStatus(id: number, isActive: boolean) {
    return apiService.request('/master-list/toggle-status', {
      method: 'PUT',
      body: JSON.stringify({ id, is_active: isActive })
    });
  }
};

