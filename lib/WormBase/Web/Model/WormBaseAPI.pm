package WormBase::Web::Model::WormBaseAPI;
use parent qw/Catalyst::Model::Adaptor/;

# Fetch the default args and pass along some extras
# including our C::Log::Log4perl
sub prepare_arguments {
  my ($self, $c) = @_;
  my $args     = $c->config->{'Model::WormBaseAPI'}->{args};
  $args->{log} = $c->log;
  $args->{config} = $c->config;
  return $args;
}


1;
