function getSecretKey(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    // Cette erreur sera maintenant levée uniquement si process.env.SECRET_KEY
    // n'est toujours pas défini au moment où jwtConstants.secret est accédé.
    throw new Error(
      'FATAL ERROR: SECRET_KEY is not defined or not loaded from .env file at the time of use.',
    );
  }
  return secret;
}

function getExpiresIn(): string {
  const expiresIn = process.env.JWT_EXPIRATION_TIME;
  if (!expiresIn) {
    throw new Error(
      'FATAL ERROR: JWT_EXPIRATION_TIME is not defined or not loaded from .env file at the time of use.',
    );
  }
  return expiresIn;
}

function getRefreshExpiresIn(): string {
  const refreshExpiresIn = process.env.JWT_REFRESH_EXPIRATION_TIME;
  if (!refreshExpiresIn) {
    throw new Error(
      'FATAL ERROR: JWT_REFRESH_EXPIRATION_TIME is not defined or not loaded from .env file at the time of use.',
    );
  }
  return refreshExpiresIn;
}

export const jwtConstants = {
  get secret(): string {
    // Utilisation d'un getter
    return getSecretKey();
  },
  get expiresIn(): string {
    return getExpiresIn();
  },
  get refreshExpiresIn(): string {
    return getRefreshExpiresIn();
  },
  // expiresIn: '1h', // Token expire après une heure
  // refreshExpiresIn: '7d' // Refresh token expire après 7 jours
};
