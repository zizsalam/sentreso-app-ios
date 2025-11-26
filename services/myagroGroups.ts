import { supabase } from './supabaseClient';

export type FarmerGroup = {
  id: string;
  ve_id: string;
  name: string;
  village: string;
  language: 'wolof' | 'pulaar' | 'french';
  created_at: string;
  updated_at: string;
};

export type Farmer = {
  id: string;
  group_id: string;
  name: string;
  phone: string;
  package_type: 'poultry' | 'seed' | 'fertilizer' | 'other';
  package_cost: number;
  payment_deadline: string;
  weekly_savings_target: number;
  language: 'wolof' | 'pulaar' | 'french';
  savings_progress: number;
  payment_status: 'pending' | 'on_track' | 'behind' | 'paid';
  created_at: string;
  updated_at: string;
};

export class MyAgroGroupsService {
  async createGroup(
    data: Pick<FarmerGroup, 'name' | 'village' | 'language'> & { ve_id?: string }
  ): Promise<FarmerGroup> {
    let veId = data.ve_id;
    if (!veId) {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) {
        throw new Error(`Impossible de récupérer l'utilisateur: ${authError.message}`);
      }
      if (!authData?.user?.id) {
        throw new Error('Utilisateur non authentifié');
      }
      veId = authData.user.id;
    }

    const { data: group, error } = await supabase
      .from('myagro_groups')
      .insert({ name: data.name, village: data.village, language: data.language, ve_id: veId })
      .select()
      .single();

    if (error) {
      throw new Error(`createGroup failed: ${error.message}`);
    }
    return group as FarmerGroup;
  }

  async listGroups(): Promise<FarmerGroup[]> {
    const { data, error } = await supabase
      .from('myagro_groups')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`listGroups failed: ${error.message}`);
    }
    return (data as FarmerGroup[]) || [];
  }

  async getGroupWithFarmers(
    groupId: string
  ): Promise<{ group: FarmerGroup; farmers: Farmer[] }> {
    const { data: group, error: groupError } = await supabase
      .from('myagro_groups')
      .select('*')
      .eq('id', groupId)
      .single();

    if (groupError) {
      throw new Error(`getGroup failed: ${groupError.message}`);
    }

    const { data: farmers, error: farmerError } = await supabase
      .from('myagro_farmers')
      .select('*')
      .eq('group_id', groupId)
      .order('name');

    if (farmerError) {
      throw new Error(`listFarmers failed: ${farmerError.message}`);
    }

    return {
      group: group as FarmerGroup,
      farmers: (farmers as Farmer[]) || [],
    };
  }

  async addFarmer(
    groupId: string,
    data: Omit<Farmer, 'id' | 'group_id' | 'created_at' | 'updated_at'>
  ): Promise<Farmer> {
    const payload = { ...data, group_id: groupId };
    const { data: farmer, error } = await supabase
      .from('myagro_farmers')
      .insert(payload)
      .select()
      .single();

    if (error) {
      throw new Error(`addFarmer failed: ${error.message}`);
    }
    return farmer as Farmer;
  }

  async updateFarmer(
    farmerId: string,
    data: Partial<
      Omit<Farmer, 'id' | 'group_id' | 'created_at' | 'updated_at'>
    >
  ): Promise<Farmer> {
    const { data: farmer, error } = await supabase
      .from('myagro_farmers')
      .update(data)
      .eq('id', farmerId)
      .select()
      .single();

    if (error) {
      throw new Error(`updateFarmer failed: ${error.message}`);
    }
    return farmer as Farmer;
  }

  async deleteFarmer(farmerId: string): Promise<void> {
    const { error } = await supabase
      .from('myagro_farmers')
      .delete()
      .eq('id', farmerId);

    if (error) {
      throw new Error(`deleteFarmer failed: ${error.message}`);
    }
  }

  async updateSavingsProgress(farmerId: string, savingsProgress: number) {
    const { error } = await supabase
      .from('myagro_farmers')
      .update({ savings_progress: savingsProgress })
      .eq('id', farmerId);

    if (error) {
      throw new Error(`updateSavingsProgress failed: ${error.message}`);
    }
  }

  async markPaymentStatus(
    farmerId: string,
    status: Farmer['payment_status']
  ): Promise<void> {
    const { error } = await supabase
      .from('myagro_farmers')
      .update({ payment_status: status })
      .eq('id', farmerId);

    if (error) {
      throw new Error(`markPaymentStatus failed: ${error.message}`);
    }
  }
}
