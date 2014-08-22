#!/bin/bash

# Server::Starter daemon that manages Starman.
# Based on http://j.shirley.im/tech/perl/start_server.html

# Here's how to call start_server from the command line.
# start_server --port=PORT --pid-file=$PID --status-file=$STATUS -- starman  wormbase.psgi


# Pull in our local environment variables
# Since wormbase.env isn't in our code repository,
# production servers won't have it; staging/dev servers do.
# We keep our env file outside of the repository to
# so it doesn't have to be maintained across branches.
source /usr/local/wormbase/wormbase.env

# $ENV{APP} needs to be set during build.
# It's used here to dynamically configure
# starman options.
# It's also used to over-ride the
# catalyst local configuration suffix, for example,
# wormbase_production.conf instead of wormbase_local.conf.
# (I could probably pitch the environment specific
# config files, too. They could be checked out by CI)


# If the APP environment variable isn't set,
# assume we are running in production.
if [ ! $APP ]; then
    echo "   ---> APP is set not defined..."
    echo "        Assuming we are a production deployment."
    echo "        Using wormbase_production.conf."

    export APP=production

    # Application defaults
    export DAEMONIZE=true
    export PORT=5000
    export WORKERS=10
    export MAX_REQUESTS=500

    # The suffix for the configuration file to use.
    # This will take precedence over wormbase_local.conf
    # Primarily used to override the location of the user database.
    export CATALYST_CONFIG_LOCAL_SUFFIX=$APP

elif [ $APP == 'staging' ]; then
    echo "   ---> APP is set to staging..."
    echo "        Assuming we are host:staging.wormbase.org."
    echo "        Using wormbase_staging.conf."
    # reduce the number of workers.
    export DAEMONIZE=true
    export PORT=5000
    export WORKERS=5
    export MAX_REQUESTS=500

    # The suffix for the configuration file to use.
    # This will take precedence over wormbase_local.conf
    # Primarily used to override the location of the user database.
    export CATALYST_CONFIG_LOCAL_SUFFIX=$APP

elif [ $APP == 'qaqc' ]; then

    echo "   ---> APP is set to ${APP}: assuming we are host:qaqc.wormbase.org using wormbase_${APP}.conf"

    # reduce the number of workers.
    export DAEMONIZE=true
    export PORT=5000
    export WORKERS=8
    export MAX_REQUESTS=500

else
    echo "   ---> APP is set to ${APP}: using wormbase_local.conf"    
    # In this case, $ENV{APP} is typically something like "tharris"
    
    # Assume these to all be set in the local environment
    export PORT=9001
    export WORKERS=3
    export STARMAN_DEBUG=1
    export CATALYST_CONFIG_LOCAL_SUFFIX=local

fi

# The suffix for the configuration file to use.
# This will take precedence over wormbase_local.conf
# Primarily used to override the location of the user database.
export CATALYST_CONFIG_LOCAL_SUFFIX=$APP

# The actual path on disk to the application.
export APP_HOME=`pwd`

# For dumb install environments. Not ideal.
export PERL5LIB="/usr/local/wormbase/extlib/lib/perl5:/usr/local/wormbase/extlib/lib/perl5/x86_64-linux-gnu-thread-multi:$ENV{APP_HOME}/lib:$PERL5LIB"
export MODULEBUILDRC="/usr/local/wormbase/extlib/.modulebuildrc"
export PERL_MM_OPT="INSTALL_BASE=/usr/local/wormbase/extlib"
export PATH="/usr/local/wormbase/extlib/bin:$PATH"


PIDFILE="$APP_HOME/logs/wormbase.pid"

# Starman access/error logs. Log4perl sets up the app-
# specific logs.
ERROR_LOG="$APP_HOME/logs/starman-error.log"
ACCESS_LOG="$APP_HOME/logs/starman-access.log"
STATUS="$APP_HOME/logs/wormbase.status"

if [ ! -d "$APP_HOME" ]; then
    echo "\$APP_HOME does not exist"
    exit 1
fi

if [ ! $WORKERS ]; then
    echo "\$WORKERS is not defined"
    exit 1
fi

if [ ! $PORT ]; then
    echo "\$PORT is not defined"
    exit 1
fi

if [ ! $MAX_REQUESTS ]; then
    MAX_REQUESTS=1000
fi


# Starman configuration
# is the --daemonize flag necessary in this setting?
STARMAN=`which starman`
STARMAN_OPTS="-I$APP_HOME/lib --access-log $ACCESS_LOG --error-log $ERROR_LOG --workers $WORKERS --max-requests $MAX_REQUESTS --port $PORT $APP_HOME/wormbase.psgi"
#STARMAN_OPTS="-I$APP_HOME/lib --workers $WORKERS --max-requests $MAX_REQUESTS --port $PORT $APP_HOME/wormbase.psgi"

# start_server configuration
START_SERVER_DAEMON=`which start_server`
START_SERVER_DAEMON_OPTS="--pid-file=$PIDFILE --status-file=$STATUS --port $PORT -- $STARMAN $STARMAN_OPTS"

cd $APP_HOME

# Might even consider doing crazy things like:
# cpanm --installdeps .

# Or running our test suite...

# Or checking out our wormbase_local.conf file.

$START_SERVER_DAEMON --restart $START_SERVER_DAEMON_OPTS

# If the restart failed (2 or 3) then try again. We could put in a kill.
if [ $? -gt 0 ]; then
    echo "Restart failed, application likely not running. Starting..."
    # Rely on start-stop-daemon to run start_server in the background
    # The PID will be written by start_server
    /sbin/start-stop-daemon --start --background  \
                --chdir $APP_HOME --exec $START_SERVER_DAEMON -- $START_SERVER_DAEMON_OPTS

#    /sbin/start-stop-daemon --start   \
#                --chdir $APP_HOME --exec $START_SERVER_DAEMON -- $START_SERVER_DAEMON_OPTS
fi

