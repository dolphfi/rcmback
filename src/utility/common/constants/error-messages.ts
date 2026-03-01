/**
 * Messages d'erreur standardisés pour le module Notes
 * Tous les messages sont en français pour une expérience utilisateur cohérente
 */

export const ERROR_MESSAGES = {
  // Authentification et autorisation
  AUTH: {
    REQUIRED: 'Authentification requise. Veuillez vous connecter.',
    UNAUTHENTICATED: 'Utilisateur non authentifié correctement.',
    UNAUTHORIZED_VALIDATE:
      "Vous n'êtes pas autorisé à valider des notes. Seuls les administrateurs et secrétaires peuvent effectuer cette action.",
    UNAUTHORIZED_GRADE:
      "Vous n'êtes pas autorisé à noter ce cours. Vérifiez vos assignations de cours.",
    UNAUTHORIZED_VIEW_NOTES: "Vous n'êtes pas autorisé à consulter ces notes.",
    UNAUTHORIZED_VIEW_REPORT:
      "Vous n'êtes pas autorisé à consulter ce bulletin.",
    UNAUTHORIZED_PROFILE_UPDATE:
      'Les étudiants ne sont pas autorisés à modifier leur profil.',
    INVALID_CURRENT_PASSWORD: "L'ancien mot de passe est incorrect.",
  },

  // Entités non trouvées
  NOT_FOUND: {
    STUDENT: (id: string) =>
      `Étudiant introuvable. Vérifiez l'identifiant fourni.`,
    COURSE: (id: string) => `Cours introuvable. Vérifiez l'identifiant fourni.`,
    NOTE: (id: string) => `Note introuvable. Vérifiez l'identifiant fourni.`,
    PENDING_NOTE: (id: string) =>
      `Aucune note en attente trouvée. Vérifiez l'identifiant ou le statut de la note.`,
    ACADEMIC_YEAR: (id: string) =>
      `Année académique introuvable. Vérifiez l'identifiant fourni.`,
    CLASSROOM: (id: string) =>
      `Classe introuvable. Vérifiez l'identifiant fourni.`,
    ROOM: (id: string) => `Salle introuvable. Vérifiez l'identifiant fourni.`,
    USER: (id: string) =>
      `Utilisateur introuvable. Vérifiez l'identifiant fourni.`,
    STUDENT_BY_USER_ID: (userId: string) =>
      `Étudiant associé à l'utilisateur introuvable. Vérifiez l'identifiant utilisateur.`,
    STUDENT_BY_MATRICULE: (matricule: string) =>
      `Aucun étudiant trouvé avec le matricule ${matricule}. Vérifiez le matricule fourni.`,
    RESPONSIBLE_PERSON: (id: string) =>
      `Personne responsable introuvable. Vérifiez l'identifiant fourni.`,
    RESPONSIBLE_BY_USER_ID: (userId: string) =>
      `Personne responsable associée à l'utilisateur introuvable. Vérifiez l'identifiant utilisateur.`,
    SETTING: (id: string) =>
      `Paramètre introuvable. Vérifiez l'identifiant fourni.`,
    SETTING_BY_KEY: (key: string) =>
      `Le paramètre avec la clé '${key}' n'a pas été trouvé.`,
    SETTING_BY_GROUP: (group: string) =>
      `Aucun paramètre trouvé pour le groupe '${group}'.`,
    ACADEMIC_YEAR_CURRENT: 'Aucune année académique courante configurée.',
    SCHEDULE: (id: string) =>
      `Emploi du temps introuvable. Vérifiez l'identifiant fourni.`,
    HOLIDAY: (id: string) =>
      `Jour férié introuvable. Vérifiez l'identifiant fourni.`,
    STUDENT_PROFILE: "Profil étudiant introuvable pour l'utilisateur actuel.",
    TEACHER_PROFILE: "Profil enseignant introuvable pour l'utilisateur actuel.",
    VALIDATOR_USER:
      "Utilisateur validateur introuvable. Contactez l'administration.",
    STUDENTS_IN_CLASSROOM:
      'Aucun étudiant trouvé dans cette classe. Vérifiez que des étudiants sont bien inscrits.',
    STUDENTS_IN_ROOM:
      "Aucun étudiant trouvé dans cette salle. Vérifiez les assignations d'étudiants.",
  },

  // Validation métier
  BUSINESS: {
    NO_CURRENT_ACADEMIC_YEAR:
      "Aucune année académique active n'est définie. Contactez l'administration.",
    NOTE_EXCEEDS_PONDERATION: (note: number, ponderation: number) =>
      `La note (${note}) ne peut pas dépasser la pondération du cours (${ponderation}).`,
    NOTE_ALREADY_VALIDATED: (note: number, ponderation: number) =>
      `Une note a déjà été validée pour ce trimestre (${note}/${ponderation}). Contactez l'administration si vous souhaitez la modifier.`,
    NOTE_ALREADY_EXISTS_ADMIN_ONLY:
      'Une note a déjà été enregistrée pour ce trimestre. Seul un administrateur peut la modifier.',
    NOTE_ALREADY_PROCESSED: (status: string) =>
      `Cette note a déjà été traitée. Statut actuel: ${status}. Seules les notes en attente (PENDING) peuvent être validées.`,
    STUDENT_NO_CLASS:
      "L'étudiant n'est assigné à aucune classe. Contactez l'administration.",
    STUDENT_NO_ROOM:
      "L'étudiant n'est assigné à aucune salle spécifique. Contactez l'administration.",
    STUDENT_NO_CLASS_ASSIGNMENT: (id: string) =>
      "Étudiant introuvable ou non assigné à une classe. Vérifiez l'inscription.",
    STUDENT_NO_ROOM_ASSIGNMENT: (id: string) =>
      "L'étudiant n'est assigné à aucune salle spécifique. Vérifiez les assignations.",
    MISSING_RELATIONS: (id: string) =>
      "Données incomplètes pour cette note. Contactez l'administration.",
    PASSWORDS_DO_NOT_MATCH: 'Les mots de passe ne correspondent pas.',
    NEW_PASSWORDS_DO_NOT_MATCH:
      'Le nouveau mot de passe et sa confirmation ne correspondent pas.',
    EMAIL_ALREADY_EXISTS: (email: string) =>
      `L'adresse email ${email} est déjà utilisée.`,
    MULTIPART_FORM_REQUIRED:
      'La requête doit être de type multipart/form-data.',
    RESPONSIBLE_ID_OR_DATA_REQUIRED:
      'ID de responsable ou données de création requises.',
    ROOM_NOT_IN_CLASSROOM: (roomName: string, classroomName: string) =>
      `La salle '${roomName}' n'appartient pas à la classe '${classroomName}'.`,
    ROOM_UNAVAILABLE: (roomName: string) =>
      `La salle '${roomName}' est actuellement indisponible et ne peut pas recevoir de nouveaux étudiants.`,
    USER_EMAIL_OR_MATRICULE_EXISTS:
      'Un utilisateur avec cet email ou un matricule similaire existe déjà.',
    USER_EMAIL_OR_NIF_EXISTS:
      'Un utilisateur avec cet email ou NIF/NINU existe déjà.',
    NO_CURRENT_ACADEMIC_YEAR_FOR_STUDENT:
      "Aucune année académique n'est actuellement 'En cours'. Impossible de créer un nouvel étudiant.",
    MATRICULE_GENERATION_CONFLICT:
      'La génération du matricule a produit un doublon. Veuillez réessayer.',
    SETTING_KEY_EXISTS: (key: string) =>
      `Le paramètre avec la clé '${key}' existe déjà.`,
    ACADEMIC_YEAR_LABEL_EXISTS: (label: string) =>
      `Une année académique avec le label "${label}" existe déjà.`,
    SETTING_VALUE_AND_LABEL_REQUIRED:
      'La `value` et le `label` sont requis pour créer un nouveau paramètre.',
    NO_FILE_UPLOADED: "Aucun fichier n'a été uploadé.",
    NO_FILE_IN_REQUEST: 'Aucun fichier trouvé dans la requête.',
    INVALID_MULTIPART_REQUEST:
      'Requête invalide: le contenu doit être multipart/form-data.',
    SCHEDULE_EXISTS_FOR_ROOM: (roomName: string, dayOfWeek: string) =>
      `Un emploi du temps pour la salle "${roomName}" le ${dayOfWeek} existe déjà.`,
    TIME_SLOT_END_BEFORE_START: (endTime: string, startTime: string) =>
      `L'heure de fin (${endTime}) ne peut pas être antérieure à l'heure de début (${startTime}) pour une plage horaire.`,
    COURSE_NOT_IN_CLASSROOM: (courseTitle: string, classroomName: string) =>
      `Le cours "${courseTitle}" n'appartient pas à la classe "${classroomName}".`,
    ROOM_NOT_IN_CLASSROOM_SCHEDULE: (roomName: string, classroomName: string) =>
      `La salle "${roomName}" n'appartient pas à la classe "${classroomName}".`,
    USER_CONTEXT_MISSING: 'Le contexte utilisateur est manquant.',
  },

  // Erreurs système
  SYSTEM: {
    UNEXPECTED_VALIDATION_ERROR:
      "Une erreur inattendue s'est produite lors de la validation. Veuillez réessayer ou contacter l'administration.",
    GENERAL_ERROR:
      "Une erreur système s'est produite. Veuillez réessayer ou contacter l'administration.",
    USER_CREATION_ERROR:
      "Une erreur est survenue lors de la création de l'utilisateur.",
    PROFILE_UPDATE_ERROR:
      'Une erreur est survenue lors de la mise à jour du profil.',
    PASSWORD_UPDATE_ERROR:
      'Une erreur est survenue lors de la mise à jour du mot de passe.',
    ACCOUNT_UNLOCK_ERROR:
      'Une erreur est survenue lors de la tentative de déverrouillage du compte utilisateur.',
    FORM_PROCESSING_ERROR:
      'Erreur lors du traitement des données du formulaire.',
    STUDENT_CREATION_ERROR:
      "Une erreur inattendue est survenue lors de la création de l'\u00e9tudiant.",
    STUDENT_UPDATE_ERROR: 'Une erreur est survenue lors de la mise à jour.',
    RESPONSIBLE_CREATION_ERROR:
      'Une erreur est survenue lors de la création de la personne responsable.',
    RESPONSIBLE_UPDATE_ERROR: 'Une erreur est survenue lors de la mise à jour.',
    AVATAR_UPLOAD_ERROR: 'Échec du téléversement du nouvel avatar.',
    SCHEDULE_RETRIEVAL_ERROR:
      "Impossible de récupérer l'emploi du temps après création.",
    PAYMENT_CREATION_ERROR:
      'Une erreur est survenue lors de la création du paiement.',
    PAYMENT_UPDATE_ERROR:
      'Une erreur est survenue lors de la mise à jour du paiement.',
    PAYMENT_NOTIFICATION_ERROR:
      "Impossible d'envoyer la notification de paiement.",
    STRIPE_SERVICE_UNAVAILABLE: "Le service Stripe n'est pas configuré.",
    PAYPAL_SERVICE_UNAVAILABLE: "Le service PayPal n'est pas configuré.",
    WEBHOOK_VALIDATION_ERROR: 'Erreur de validation du webhook.',
    PAYMENT_CAPTURE_ERROR: 'Erreur lors de la capture du paiement.',
  },
};

// Messages spécifiques au tableau de bord
export const DASHBOARD_MESSAGES = {
  NOT_FOUND: {
    STUDENT_PROFILE: "Profil étudiant introuvable pour l'utilisateur actuel.",
    PARENT_PROFILE: "Profil parent introuvable pour l'utilisateur actuel.",
    TEACHER_PROFILE: "Profil enseignant introuvable pour l'utilisateur actuel.",
    CHILDREN_FOR_PARENT: 'Aucun enfant trouvé pour ce parent.',
  },
  BUSINESS: {
    ROLE_NOT_SUPPORTED: 'Rôle non supporté pour le tableau de bord.',
    NO_DASHBOARD_ACCESS: 'Accès au tableau de bord non autorisé pour ce rôle.',
    INSUFFICIENT_PERMISSIONS:
      'Permissions insuffisantes pour accéder aux données du tableau de bord.',
  },
  SYSTEM: {
    DASHBOARD_DATA_ERROR:
      'Erreur lors de la récupération des données du tableau de bord.',
    STUDENT_DATA_ERROR: 'Erreur lors de la récupération des données étudiant.',
    PARENT_DATA_ERROR: 'Erreur lors de la récupération des données parent.',
    TEACHER_DATA_ERROR:
      'Erreur lors de la récupération des données enseignant.',
  },
  SUCCESS: {
    DASHBOARD_LOADED: 'Tableau de bord chargé avec succès.',
    STUDENT_DASHBOARD_LOADED: 'Tableau de bord étudiant chargé avec succès.',
    PARENT_DASHBOARD_LOADED: 'Tableau de bord parent chargé avec succès.',
    TEACHER_DASHBOARD_LOADED: 'Tableau de bord enseignant chargé avec succès.',
  },
};

// Messages spécifiques à l'authentification
export const AUTH_MESSAGES = {
  NOT_FOUND: {
    USER: 'Utilisateur introuvable.',
    USER_BY_EMAIL: (email: string) =>
      `Utilisateur avec l'email "${email}" introuvable.`,
    USER_BY_PHONE: (phone: string) =>
      `Utilisateur avec le numéro "${phone}" introuvable.`,
    USER_BY_ID: (id: string) => `Utilisateur avec l'ID "${id}" introuvable.`,
    USER_BY_VERIFICATION_TOKEN: 'Lien de vérification invalide ou expiré.',
    USER_BY_RESET_TOKEN: 'Lien de réinitialisation invalide ou expiré.',
  },
  BUSINESS: {
    EMAIL_ALREADY_EXISTS: 'Cet email est déjà utilisé.',
    PHONE_ALREADY_EXISTS: 'Ce numéro de téléphone est déjà utilisé.',
    INVALID_CREDENTIALS: 'Email ou mot de passe incorrect.',
    ACCOUNT_LOCKED:
      'Compte temporairement verrouillé en raison de trop nombreuses tentatives de connexion.',
    ACCOUNT_NOT_VERIFIED:
      'Veuillez vérifier votre email avant de vous connecter.',
    ACCOUNT_INACTIVE:
      "Votre compte a été désactivé. Contactez l'administrateur.",
    TWO_FACTOR_REQUIRED: 'Authentification à deux facteurs requise.',
    INVALID_2FA_CODE: "Code d'authentification à deux facteurs invalide.",
    TWO_FACTOR_NOT_ENABLED:
      "L'authentification à deux facteurs n'est pas activée pour ce compte.",
    TWO_FACTOR_ALREADY_ENABLED:
      "L'authentification à deux facteurs est déjà activée.",
    INVALID_REFRESH_TOKEN: 'Token de rafraîchissement invalide.',
    TOKEN_EXPIRED: 'Token expiré.',
    EMAIL_ALREADY_VERIFIED: 'Votre email est déjà vérifié.',
    RESET_TOKEN_EXPIRED: 'Lien de réinitialisation expiré.',
    DEVICE_NOT_TRUSTED:
      'Appareil non reconnu. Vérification supplémentaire requise.',
  },
  SYSTEM: {
    REGISTRATION_ERROR:
      "Une erreur technique est survenue lors de l'inscription.",
    LOGIN_ERROR: 'Une erreur technique est survenue lors de la connexion.',
    EMAIL_SEND_ERROR: "Erreur lors de l'envoi de l'email.",
    PASSWORD_RESET_ERROR:
      'Une erreur est survenue lors de la réinitialisation de votre mot de passe.',
    EMAIL_VERIFICATION_ERROR:
      'Une erreur est survenue lors de la vérification de votre email.',
    TWO_FACTOR_SETUP_ERROR:
      "Erreur lors de la configuration de l'authentification à deux facteurs.",
    TOKEN_GENERATION_ERROR: 'Erreur lors de la génération du token.',
    USER_UPDATE_ERROR: "Erreur lors de la mise à jour de l'utilisateur.",
  },
  SUCCESS: {
    REGISTRATION_SUCCESS:
      'Inscription réussie. Un email de vérification a été envoyé.',
    LOGIN_SUCCESS: 'Connexion réussie.',
    EMAIL_VERIFIED:
      'Votre email a été vérifié avec succès. Vous pouvez maintenant vous connecter.',
    PASSWORD_RESET_SENT:
      "Si l'email existe, un lien de réinitialisation a été envoyé.",
    PASSWORD_RESET_SUCCESS:
      'Votre mot de passe a été réinitialisé avec succès.',
    TWO_FACTOR_ENABLED: 'Authentification à deux facteurs activée avec succès.',
    TWO_FACTOR_DISABLED:
      'Authentification à deux facteurs désactivée avec succès.',
    VERIFICATION_EMAIL_SENT: 'Email de vérification envoyé avec succès.',
    RESET_EMAIL_SENT: 'Email de réinitialisation envoyé avec succès.',
    TOKEN_REFRESHED: 'Token rafraîchi avec succès.',
  },
};

export const SUCCESS_MESSAGES = {
  NOTE_SUBMITTED: 'Note soumise pour validation.',
  NOTE_UPDATED: 'Votre soumission précédente a été mise à jour.',
  NOTE_VALIDATED: 'Note validée et enregistrée avec succès.',
  REPORT_CARDS_SCHEDULED:
    'La génération des bulletins a été programmée avec succès.',
  PASSWORD_UPDATED: 'Mot de passe mis à jour avec succès.',
};
