import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  User, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Heart, 
  Users,
  Mic,
  Calendar
} from "lucide-react";
import { format } from "date-fns";

interface Profile {
  id: string;
  name: string;
  relation: string;
  notes: string;
  createdAt: Date;
  voiceModelStatus: 'not_submitted' | 'training' | 'ready';
  recordingsCount: number;
  messagesCount: number;
}

interface UserProfilesProps {
  profiles: Profile[];
  currentProfile?: Profile;
  onSelectProfile: (profile: Profile) => void;
  onCreateProfile: (profile: Omit<Profile, 'id' | 'createdAt' | 'voiceModelStatus' | 'recordingsCount' | 'messagesCount'>) => void;
  onUpdateProfile: (id: string, updates: Partial<Profile>) => void;
  onDeleteProfile: (id: string) => void;
}

export default function UserProfiles({ 
  profiles, 
  currentProfile, 
  onSelectProfile, 
  onCreateProfile, 
  onUpdateProfile, 
  onDeleteProfile 
}: UserProfilesProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    relation: "",
    notes: ""
  });

  const handleCreate = () => {
    if (formData.name.trim() && formData.relation.trim()) {
      onCreateProfile(formData);
      setFormData({ name: "", relation: "", notes: "" });
      setIsCreating(false);
    }
  };

  const handleEdit = (profile: Profile) => {
    setFormData({
      name: profile.name,
      relation: profile.relation,
      notes: profile.notes
    });
    setEditingId(profile.id);
  };

  const handleUpdate = () => {
    if (editingId && formData.name.trim() && formData.relation.trim()) {
      onUpdateProfile(editingId, formData);
      setFormData({ name: "", relation: "", notes: "" });
      setEditingId(null);
    }
  };

  const handleCancel = () => {
    setFormData({ name: "", relation: "", notes: "" });
    setIsCreating(false);
    setEditingId(null);
  };

  const getStatusColor = (status: Profile['voiceModelStatus']) => {
    switch (status) {
      case 'ready': return 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300';
      case 'training': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-950 dark:text-gray-300';
    }
  };

  const getStatusText = (status: Profile['voiceModelStatus']) => {
    switch (status) {
      case 'ready': return 'Voice Ready';
      case 'training': return 'Training';
      default: return 'Not Started';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-serif flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>Voice Profiles</span>
              </CardTitle>
              <p className="text-muted-foreground mt-1">
                Manage multiple voice profiles for different family members
              </p>
            </div>
            {!isCreating && (
              <Button 
                onClick={() => setIsCreating(true)}
                data-testid="button-add-profile"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Profile
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Create/Edit Form */}
      {(isCreating || editingId) && (
        <Card className="border-accent/20">
          <CardHeader>
            <CardTitle className="text-lg">
              {isCreating ? 'Create New Profile' : 'Edit Profile'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="profile-name">Name *</Label>
                <Input
                  id="profile-name"
                  placeholder="e.g., Dad, Grandma, Uncle John"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  data-testid="input-profile-name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="profile-relation">Relation *</Label>
                <Input
                  id="profile-relation"
                  placeholder="e.g., Father, Grandmother, Uncle"
                  value={formData.relation}
                  onChange={(e) => setFormData(prev => ({ ...prev, relation: e.target.value }))}
                  data-testid="input-profile-relation"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="profile-notes">Notes (Optional)</Label>
              <Textarea
                id="profile-notes"
                placeholder="Any special notes about this person's voice or recording preferences..."
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                data-testid="textarea-profile-notes"
              />
            </div>
            
            <div className="flex space-x-3 pt-2">
              <Button
                onClick={isCreating ? handleCreate : handleUpdate}
                disabled={!formData.name.trim() || !formData.relation.trim()}
                data-testid="button-save-profile"
              >
                <Save className="w-4 h-4 mr-2" />
                {isCreating ? 'Create Profile' : 'Save Changes'}
              </Button>
              <Button
                onClick={handleCancel}
                variant="outline"
                data-testid="button-cancel-profile"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Profiles Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {profiles.map((profile) => {
          const isActive = currentProfile?.id === profile.id;
          const isEditing = editingId === profile.id;
          
          return (
            <Card 
              key={profile.id}
              className={`hover-elevate transition-all duration-200 cursor-pointer ${
                isActive ? 'ring-2 ring-accent border-accent/50' : ''
              } ${isEditing ? 'opacity-50 pointer-events-none' : ''}`}
              onClick={() => !isEditing && onSelectProfile(profile)}
              data-testid={`profile-card-${profile.id}`}
            >
              <CardContent className="p-6 space-y-4">
                {/* Avatar and Basic Info */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-12 h-12">
                      <AvatarFallback className="bg-accent/20 text-accent-foreground font-medium">
                        {profile.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-lg">{profile.name}</h3>
                      <p className="text-muted-foreground text-sm">{profile.relation}</p>
                    </div>
                  </div>
                  
                  {isActive && (
                    <Badge variant="default" className="bg-accent text-accent-foreground">
                      Active
                    </Badge>
                  )}
                </div>

                {/* Status */}
                <div className="space-y-2">
                  <Badge className={getStatusColor(profile.voiceModelStatus)} variant="secondary">
                    <Mic className="w-3 h-3 mr-1" />
                    {getStatusText(profile.voiceModelStatus)}
                  </Badge>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="text-center p-2 bg-muted/50 rounded-md">
                    <div className="font-semibold">{profile.recordingsCount}</div>
                    <div className="text-muted-foreground text-xs">Recordings</div>
                  </div>
                  <div className="text-center p-2 bg-muted/50 rounded-md">
                    <div className="font-semibold">{profile.messagesCount}</div>
                    <div className="text-muted-foreground text-xs">Messages</div>
                  </div>
                </div>

                {/* Notes */}
                {profile.notes && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {profile.notes}
                  </p>
                )}

                {/* Created Date */}
                <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  <span>Created {format(profile.createdAt, 'MMM d, yyyy')}</span>
                </div>

                {/* Actions */}
                <div className="flex justify-between pt-2 border-t">
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(profile);
                    }}
                    variant="outline"
                    size="sm"
                    data-testid={`button-edit-${profile.id}`}
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                  
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteProfile(profile.id);
                    }}
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10"
                    data-testid={`button-delete-${profile.id}`}
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {profiles.length === 0 && !isCreating && (
        <Card>
          <CardContent className="p-12 text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">No Profiles Yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first profile to start preserving voices for your family
              </p>
              <Button onClick={() => setIsCreating(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Profile
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}