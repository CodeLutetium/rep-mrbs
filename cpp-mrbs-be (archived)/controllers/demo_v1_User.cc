#include "demo_v1_User.h"
#include "drogon/HttpResponse.h"
#include "drogon/orm/Mapper.h"
#include "models/Rooms.h"
#include "trantor/utils/Logger.h"
#include <functional>
#include <vector>

using namespace demo::v1;

// Add definition of your processing function here
void User::login(const HttpRequestPtr &req,
                 std::function<void(const HttpResponsePtr &)> &&callback,
                 std::string &&userId, const std::string &password) {
    LOG_DEBUG << "User " << userId << " login";

    Json::Value ret;

    ret["result"] = "ok";

    ret["token"] = drogon::utils::getUuid();

    auto response = HttpResponse::newHttpJsonResponse(ret);

    callback(response);
}

void User::getInfo(const HttpRequestPtr &req,
                   std::function<void(const HttpResponsePtr &)> &&callback,
                   std::string userId, const std::string &token) const {
    LOG_DEBUG << "User " << userId << " get his information";

    Json::Value ret;
    ret["ping"] = "pong";

    ret["result"] = "ok";
    ret["user_name"] = "Jack";
    ret["user_id"] = userId;
    ret["gender"] = 1;
    auto response = HttpResponse::newHttpJsonResponse(ret);
    return callback(response);
}

void User::getRooms(const HttpRequestPtr &req,
                    std::function<void(const HttpResponsePtr &)> &&callback) {
    LOG_DEBUG << "Get rooms called";

    auto dbClient = drogon::app().getDbClient();
    auto mapper =
        drogon::orm::Mapper<drogon_model::postgres::mrbs::Rooms>(dbClient);

    mapper.findAll(
        [callback](
            const std::vector<drogon_model::postgres::mrbs::Rooms> &rooms) {
            Json::Value ret;
            ret["status"] = "success";

            // Convert rooms into JSON array
            Json::Value roomsJson(Json::arrayValue);
            for (const auto &room : rooms) {
                roomsJson.append(room.toJson());
            }

            ret["data"] = roomsJson;

            auto response = HttpResponse::newHttpJsonResponse(ret);
            callback(response);
        },
        [callback](const drogon::orm::DrogonDbException &e) {
            LOG_ERROR << "Database error: " << e.base().what();

            Json::Value ret;
            ret["status"] = "error";
            ret["message"] = "failed to retrieve rooms";

            auto response = HttpResponse::newHttpJsonResponse(ret);
            response->setStatusCode(drogon::k500InternalServerError);

            callback(response);
        });
}
