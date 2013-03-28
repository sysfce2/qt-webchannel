/****************************************************************************
**
** Copyright (C) 2011 Nokia Corporation and/or its subsidiary(-ies).
** All rights reserved.
** Contact: Nokia Corporation (qt-info@nokia.com)
**
** This file is part of the QWebChannel module on Qt labs.
**
** $QT_BEGIN_LICENSE:LGPL$
** No Commercial Usage
** This file contains pre-release code and may not be distributed.
** You may use this file in accordance with the terms and conditions
** contained in the Technology Preview License Agreement accompanying
** this package.
**
** GNU Lesser General Public License Usage
** Alternatively, this file may be used under the terms of the GNU Lesser
** General Public License version 2.1 as published by the Free Software
** Foundation and appearing in the file LICENSE.LGPL included in the
** packaging of this file.  Please review the following information to
** ensure the GNU Lesser General Public License version 2.1 requirements
** will be met: http://www.gnu.org/licenses/old-licenses/lgpl-2.1.html.
**
** In addition, as a special exception, Nokia gives you certain additional
** rights.  These rights are described in the Nokia Qt LGPL Exception
** version 1.1, included in the file LGPL_EXCEPTION.txt in this package.
**
** If you have questions regarding the use of this file, please contact
** Nokia at qt-info@nokia.com.
**
**
**
**
**
**
**
**
** $QT_END_LICENSE$
**
****************************************************************************/

var QWebChannel = function(baseUrl, initCallback)
{
    var channel = this;
    ///TODO: use ssl?
    var socketUrl = "ws://" + baseUrl;
    this.socket = new WebSocket(socketUrl, "QWebChannel");
    this.send = function(data)
    {
        channel.socket.send(JSON.stringify(data));
    };

    this.socket.onopen = function()
    {
        initCallback(channel);
    };
    this.socket.onclose = function()
    {
        console.error("web channel closed");
    };
    this.socket.onerror = function(error)
    {
        console.error("web channel error: " + error);
    };
    this.socket.onmessage = function(message)
    {
        var jsonData = JSON.parse(message.data);
        if (jsonData.id === undefined) {
            console.error("invalid message received:", message.data);
            return;
        }
        if (jsonData.data === undefined) {
            jsonData.data = {};
        }
        if (jsonData.response) {
            channel.execCallbacks[jsonData.id](jsonData.data);
            delete channel.execCallbacks[jsonData.id];
        } else if (channel.subscriptions[jsonData.id]) {
            channel.subscriptions[jsonData.id].forEach(function(callback) {
                (callback)(jsonData.data); }
            );
        }
    };

    this.subscriptions = {};
    this.subscribe = function(id, callback)
    {
        if (channel.subscriptions[id]) {
            channel.subscriptions[id].append(callback);
        } else {
            channel.subscriptions[id] = [callback];
        }
    };

    this.execCallbacks = {};
    this.execId = 0;
    this.exec = function(data, callback)
    {
        if (channel.execId === Number.MAX_VALUE) {
            // wrap
            channel.exedId = Number.MIN_VALUE;
        }
        var id = channel.execId++;
        channel.execCallbacks[id] = callback;
        channel.send({"id": id, "data": data});
    };
};