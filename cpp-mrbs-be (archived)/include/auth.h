#ifndef AUTH_H
#define AUTH_H
#include "sodium.h"
#include "trantor/utils/Logger.h"

class Auth {
  public:
    static std::string getHashedPassword(const std::string &password) {
        if (sodium_init() < 0) {
            LOG_ERROR
                << "Error initializing sodium, empty password hash generated";
            return "";
        }
        char hashed_password[crypto_pwhash_STRBYTES];

        if (crypto_pwhash_str(hashed_password, password.c_str(),
                              password.length(),
                              crypto_pwhash_OPSLIMIT_INTERACTIVE,
                              crypto_pwhash_MEMLIMIT_INTERACTIVE) != 0) {
            LOG_ERROR << "Error hashing password, returning empty string";
            return "";
        }

        return hashed_password;
    }

    static bool verifyPassword(const std::string &password,
                               const std::string &hash) {
        return crypto_pwhash_str_verify(hash.c_str(), password.c_str(),
                                        password.length()) == 0;
    }
};

#endif // !AUTH_H
