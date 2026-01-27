#include "api_v1_bookings.h"
#include "Bookings.h"
#include "Users.h"
#include "drogon/HttpAppFramework.h"
#include "drogon/HttpRequest.h"
#include "drogon/HttpResponse.h"
#include "drogon/HttpTypes.h"
#include "drogon/orm/Criteria.h"
#include "drogon/orm/Exception.h"
#include "drogon/orm/Mapper.h"
#include "drogon/orm/Result.h"
#include "trantor/utils/Date.h"
#include "trantor/utils/Logger.h"
#include <functional>
#include <memory>
#include <string>

using namespace api::v1;

// Add definition of your processing function here
void bookings::newBooking(
    const HttpRequestPtr &req,
    std::function<void(const HttpResponsePtr &)> &&callback) {
    LOG_DEBUG << "New booking request received";

    auto dbClient = drogon::app().getDbClient();
    auto bookingsMapper =
        drogon::orm::Mapper<drogon_model::postgres::mrbs::Bookings>(dbClient);
    auto usersMapper =
        drogon::orm::Mapper<drogon_model::postgres::mrbs::Users>(dbClient);

    // Retrieve fields from request body
    auto jsonData = *req->getJsonObject();

    int room_id = jsonData["room_id"].asInt();
    std::string username = jsonData["username"].asString();
    std::string start_time = jsonData["start_time"].asString();
    int num_periods = jsonData["duration"].asInt();
    std::string title = jsonData["title"].asString();

    try {
        // Retrieve the userid of the person who made the booking
        auto user_id = usersMapper
                           .findOne(orm::Criteria(
                               "name", orm::CompareOperator::EQ, username))
                           .getValueOfUserId();

        drogon_model::postgres::mrbs::Bookings newBooking;

        newBooking.setStartTime(trantor::Date::fromDbStringLocal(start_time));
        newBooking.setRoomId(room_id);
        newBooking.setUserId(user_id);
        newBooking.setEndTime(trantor::Date::fromDbStringLocal(start_time)
                                  .after(num_periods * 30 * 60));
        newBooking.setTitle(title);

        LOG_DEBUG << newBooking.getValueOfUserId();
        LOG_DEBUG << newBooking.getValueOfBookingId();

        bookingsMapper.insert(
            newBooking,
            [callback](const drogon_model::postgres::mrbs::Bookings &b) {
                LOG_DEBUG << "Booking success";
                Json::Value ret;

                ret["status"] = "success";
                ret["booking_id"] = *b.getBookingId();

                auto response = HttpResponse::newHttpJsonResponse(ret);
                callback(response);
            },
            [callback](const drogon::orm::DrogonDbException &e) {
                LOG_ERROR << "Error inserting booking into DB: "
                          << e.base().what();

                Json::Value ret;
                ret["status"] = "error";
                ret["message"] = e.base().what();

                auto response = HttpResponse::newHttpJsonResponse(ret);
                response->setStatusCode(drogon::k500InternalServerError);
                callback(response);
            });

    } catch (const drogon::orm::DrogonDbException &e) {
        LOG_ERROR << "User not found or DB error: " << e.base().what();
        auto response = HttpResponse::newHttpJsonResponse(Json::Value());
        response->setStatusCode(k404NotFound);
        response->setBody("User not found");
        callback(response);
    }
}

void bookings::getBookings(
    const HttpRequestPtr &req,
    std::function<void(const HttpResponsePtr &)> &&callback) {
    auto dbClient = drogon::app().getDbClient();

    std::string date = req->getParameter("date");

    if (date.empty()) {
        LOG_WARN << "No date provided, defaulting to today";
        date = trantor::Date::now().toDbStringLocal();
    }

    // REP room opens at 8am, closes at 2am. (hardcoded in this statement)
    std::string sql =
        "SELECT b.booking_id, u.display_name booked_by, b.start_time, "
        "b.end_time, "
        "r.display_name room_name, "
        "b.title, b.description, b.room_id "
        "FROM mrbs.BOOKINGS b "
        "INNER JOIN mrbs.USERS u ON b.user_id = u.user_id "
        "INNER JOIN mrbs.ROOMS r ON b.room_id = r.room_id "
        // hardcoded start time
        "WHERE b.start_time >= ($1 || ' 08:00')::timestamp "
        // hardcoded end time
        "AND b.start_time < (($1::date + 1) || ' 02:00')::timestamp";

    dbClient->execSqlAsync(
        sql,
        [callback](const drogon::orm::Result &r) {
            Json::Value ret(Json::arrayValue);
            for (const auto &row : r) {
                Json::Value jsonRow;

                for (const auto &field : row) {
                    jsonRow[field.name()] = field.as<std::string>();
                }

                ret.append(jsonRow);
            }

            auto response = HttpResponse::newHttpJsonResponse(ret);
            callback(response);
        },
        [callback](const drogon::orm::DrogonDbException &e) {
            LOG_ERROR << "Error fetching bookings: " << e.base().what();
            Json::Value ret;
            ret["status"] = "error";
            ret["message"] = e.base().what();

            auto response = HttpResponse::newHttpJsonResponse(ret);
            response->setStatusCode(k500InternalServerError);

            callback(response);
        },
        date);
}
