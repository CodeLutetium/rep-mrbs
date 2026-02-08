#pragma once

#include "drogon/HttpRequest.h"
#include "drogon/HttpResponse.h"
#include "drogon/HttpTypes.h"
#include <drogon/HttpController.h>
#include <functional>

using namespace drogon;

namespace api {
namespace v1 {
class auth : public drogon::HttpController<auth> {
  public:
    METHOD_LIST_BEGIN
    // use METHOD_ADD to add your custom processing function here;
    // METHOD_ADD(auth::get, "/{2}/{1}", Get); // path is
    // /api/v1/auth/{arg2}/{arg1} METHOD_ADD(auth::your_method_name,
    // "/{1}/{2}/list", Get); // path is /api/v1/auth/{arg1}/{arg2}/list
    // ADD_METHOD_TO(auth::your_method_name, "/absolute/path/{1}/{2}/list",
    // Get); // path is /absolute/path/{arg1}/{arg2}/list
    METHOD_ADD(auth::login, "/login", Post);
    METHOD_ADD(auth::logout, "/logout", Post);

    METHOD_LIST_END
    // your declaration of processing function maybe like this:
    // void get(const HttpRequestPtr& req, std::function<void (const
    // HttpResponsePtr &)> &&callback, int p1, std::string p2); void
    // your_method_name(const HttpRequestPtr& req, std::function<void (const
    // HttpResponsePtr &)> &&callback, double p1, int p2) const;
    void login(const HttpRequestPtr &req,
               std::function<void(const HttpResponsePtr &)> &&callback);
    void logout(const HttpRequestPtr &req,
                std::function<void(const HttpResponsePtr &)> &&callback);
};
} // namespace v1
} // namespace api
