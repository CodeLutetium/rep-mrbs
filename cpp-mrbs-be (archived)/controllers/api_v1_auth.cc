#include "api_v1_auth.h"
#include "Sessions.h"
#include "Users.h"
#include "drogon/HttpAppFramework.h"
#include "drogon/HttpRequest.h"
#include "drogon/HttpResponse.h"
#include "drogon/HttpTypes.h"
#include "drogon/orm/Criteria.h"
#include "drogon/orm/Mapper.h"
#include "include/auth.h"
#include "trantor/utils/Logger.h"
#include <algorithm>
#include <cctype>
#include <functional>

using namespace api::v1;

// Add definition of your processing function here
void auth::login(const HttpRequestPtr &req,
                 std::function<void(const HttpResponsePtr &)> &&callback) {
    LOG_INFO << "Login request received";

    // Retrieve fields from req body
    auto jsonData = *req->getJsonObject();

    // Validate req body
    if (!jsonData.isMember("username") || !jsonData.isMember("password")) {
        LOG_WARN
            << "username or password fields missing from login information";
        Json::Value ret;
        ret["status"] = "failed";
        ret["message"] =
            "username or password fields missing from login information";
        auto response = HttpResponse::newHttpJsonResponse(ret);
        response->setStatusCode(drogon::k400BadRequest);
        callback(response);
    }

    std::string username = jsonData["username"].asString();
    std::string password = jsonData["password"].asString();

    // Make username lowercase
    std::transform(username.begin(), username.end(), username.begin(),
                   [](unsigned char c) { return std::tolower(c); });

    auto dbClient = drogon::app().getDbClient();
    auto usersMapper =
        drogon::orm::Mapper<drogon_model::postgres::mrbs::Users>(dbClient);
    auto sessionsMapper =
        drogon::orm::Mapper<drogon_model::postgres::mrbs::Sessions>(dbClient);

    // Check if password is same as hashed password in database
    auto hashedpw =
        usersMapper
            .findOne(orm::Criteria("name", orm::CompareOperator::EQ, username))
            .getPasswordHash();

    if (!Auth::verifyPassword(password, *hashedpw)) {
        LOG_WARN << "Invalid credentials received";
    }

    auto response = HttpResponse::newHttpResponse();
    callback(response);
}

void auth::logout(const HttpRequestPtr &req,
                  std::function<void(const HttpResponsePtr &)> &&callback) {
    auto response = HttpResponse::newHttpResponse();
    callback(response);
}
