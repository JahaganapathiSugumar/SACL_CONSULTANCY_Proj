import { apiService } from './commonService';

export const masterListService = {
  submitMasterListJson(payload: Record<string, unknown>) {
    return apiService.request('/master-list', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  submitMasterListFormData(payload: Record<string, unknown>, attachments: File[]) {
    const formData = new FormData();
    formData.append('payload', JSON.stringify(payload));
    attachments.forEach((file) => {
      formData.append('attachments', file, file.name);
    });

    return apiService.request('/master-list', {
      method: 'POST',
      body: formData,
    });
  },

  getAllMasterLists() {
    return apiService.request('/master-list', {
      method: 'GET'
    });
  },

  updateMasterList(id: string | number, payload: Record<string, unknown>) {
    return apiService.request(`/master-list/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
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

