package WormBase::API::Service::Search;

use Moose;
use Config::General;


has 'dbh' => (
    is         => 'ro',
    isa        => 'WormBase::API::Service::acedb',
    );

has 'api' => (
    is         => 'ro',
    isa        => 'WormBase::API',
    );

has config => (
    is     => 'ro',
    isa    => 'Config::General',
    );


sub basic {
  my ($self,$args) = @_;
  my $class     = $args->{class};
  my $pattern   = $args->{pattern};
  my @objs = $self->dbh->fetch(-class=>$class,
			    -pattern=>$pattern);

  return _wrap_objs($self, \@objs, $class);
   
}
# Search for paper objects
sub paper {
    my ($self,$args) = @_;
   
    my @references = ();
    my $class = $args->{class};
    my $name = $args->{pattern};
    my $DB = $self->dbh;
    if ($class ne 'paper' && $class ne 'all') {
      # Keywords are treated specially because of Ace query language
      # deficiencies (bugs?)
      my $follow = $class =~ /keyword/i ?
	'Quoted_in' : ($class =~ /author/i || $class =~ /person/i) ? 'Paper' : 'Reference';
      @references = $DB->find(-query=>qq{$class IS "$name" ; >$follow},
			      -fill=>1);
      @references = grep ($_->class eq 'Paper',@references) if $class =~  /keyword/i;
    } else {
      my @ref = ();
      foreach my $class2 (qw(gene variation)) {
	my $follow = $class2 =~ /keyword/i ?
	  'Quoted_in' : ($class2 =~ /author/i || $class2 =~ /person/i) ? 'Paper' : 'Reference';
	@ref = $DB->find(-query=>qq{$class2 IS "$name" ; >$follow},
				-fill=>1);
        @ref = grep ($_->class eq 'Paper',@ref) if $class2 =~  /keyword/i;
        push(@references, @ref);
      }
    }
    
    my (%year,%author,%month,%day);
    foreach (@references) { 
    my ($yr) = $_->Publication_date; # note array context
    # some older references encode the publication year in the name
#     $yr =~ /.*(\d\d\d\d)\s.*/;
    $yr =~ /(\d\d\d\d)(-(\d\d)(-(\d\d))?)?/;
    $yr = $1;
    my $mo = $3;
    my $day = $5;

    $yr ||= 0;
    $mo ||= 0;
    $day ||= 0;
    $year{$_} = "$yr";
    $month{$_} = "$mo";
    $day{$_} = "$day";
    ($author{$_}) = $_->Author;  # note array context
  }
    my @sorted = sort { ($year{$b} <=> $year{$a}) ||  ($month{$b} <=> $month{$a}) ||  ($day{$b} <=> $day{$a}) || ($author{$a} cmp $author{$b})
		  } @references;
    return _wrap_objs($self, \@sorted, 'paper');
}

# Search for gene objects
sub gene {
  my ($self,$args) = @_;
  my $query   = $args->{pattern};
#   my ($count,@objs);
  my $DB = $self->dbh;
  my (@genes,%seen);

  if ($query =~ /^WBG.*\d+/) {
    @genes = $self->dbh->fetch(-class=>'Gene',
			    -pattern=>$query);
  } elsif (my @gene_names = $DB->fetch(-class=>'Gene_name',-name=>$query,-fill=>1)) {
      # HACK!  For cases in which a gene is assigned to more than one Public_name_for.
      @genes = grep { !$seen{$_}++} map { $_->Public_name_for } @gene_names;

      @genes = grep {!$seen{$_}++} map {$_->Sequence_name_for
					    || $_->Molecular_name_for
					    || $_->Other_name_for
					} @gene_names unless @genes;
      undef @gene_names;
  } elsif (my @gene_classes = $DB->fetch(-class=>'Gene_class',-name=>$query,-fill=>1)) {
      @genes = map { $_->Genes } @gene_classes;
  } elsif (my @transcripts = $DB->fetch(-class=>'Transcript',-name=>$query,-fill=>1)) {
      @genes = map { eval { $_->Corresponding_CDS->Gene } } @transcripts;
  } elsif (my @ests = $DB->fetch(-class=>'Sequence',-name=>$query,-fill=>1)) {
    foreach (@ests) {
      if (my $gene = $_->Gene(-filled=>1)) {
	push @genes,$gene;
      } elsif (my $cds = $_->Matching_CDS(-filled=>1)) {
	my $gene = $cds->Gene(-filled=>1);
	push @genes,$gene if $gene;
      }
    }
  }elsif (my @variations = $DB->fetch(-class=>'Variation',-name=>$query,-fill=>1)) {
      @genes = map { eval { $_->Gene} } @variations;
  }

# Try finding genes using general terms
  # 1. Homology_group
  # 2. Concise_description
  # 3. Gene_class

  unless (@genes) {
      my @homol = $DB->fetch(-query=>qq{find Homology_group where Title=*$query*});
      @genes = map { eval { $_->Protein->Corresponding_CDS->Gene } } @homol;
      push (@genes,map { $_->Genes } $DB->fetch(-query=>qq{find Gene_class where Description="*$query*"}));
      push (@genes,$DB->fetch(-query=>qq{find Gene where Concise_description=*$query*}));
  }

  unless (@genes) {
      my @accession_number = $DB->fetch(Accession_number => $query);
      my %seen;
      my @cds = grep {  $seen{$_}++ } map { $_->CDS } @accession_number;
      push @cds,grep { !$seen{$_}++ } map { eval {$_->Protein->Corrsponding_CDS } } @accession_number;
      push @cds,grep { !$seen{$_}++ } map { eval {$_->Sequence->Matching_CDS }  } @accession_number;
      @genes =  grep { !$seen{$_}++ } map { $_->Gene } @cds;
  }
  # Analyze the Other_name_for of the Gene_name to see if the gene
  # corresponds to another named gene.
  my (@unique_genes);
  %seen = ();
  foreach my $gene (@genes) {
    next if defined $seen{$gene};
    my $gene_name  = $gene->Public_name;
    my @other_names = eval { $gene_name->Other_name_for; };
    foreach my $other_name (@other_names) {
      if ($other_name ne $gene) {
	$seen{$other_name}++;
      }
    }
    push (@unique_genes,$gene);
    $seen{$gene}++;
  }
  return _wrap_objs($self, \@unique_genes, 'gene');
}

# Search for variataion objects
sub variation {
    my ($self,$args) = @_;
    my $query = $args->{pattern};
    my $DB = $self->dbh;
    my @vars;
    my %seen;

    @vars  = $self->dbh->fetch(-class=>'Variation',
			    -name=>$query);

#     @vars = $self->dbh->fetch(-class=>'Variation',
#                               -Public_name=>$query) 
    unless (@vars) {
    my @var_name = $self->dbh->fetch(-class=>'Variation_name',-name=>$query,-fill=>1); 
      # HACK!  For cases in which a gene is assigned to more than one Public_name_for.
      @vars = grep { !$seen{$_}++} map { $_->Public_name_for } @var_name;
    }

    return _wrap_objs($self, \@vars, 'variation');
}

# input: list of ace objects
# output: list of Result objects
sub _wrap_objs {
  my $self = shift;
  my $list = shift;
  my $class = shift;
  
  # don't get config info if nothing to config
  return $list if (@$list < 1); 
  
  my $api = $self->api;
  my $fields = $self->config->{'DefaultConfig'}->{pages}->{$class}->{search}->{fields};

  # default fields for all objects
  push(@$fields, qw/name common_name/);

  my @ret;
  foreach my $ace_obj (@$list) {
    my $object = $api->fetch({class => $ace_obj->class, 
                            name => $ace_obj}) or die "$!";
    my %data;
    foreach my $field (@$fields) {
      my $field_data = $object->$field;# if  $object->meta->has_method($field);
      $field_data = $field_data->{data} if $field_data->{data};
      $data{$field} = $field_data;
    }
    $data{'class'} = $class;
    push(@ret, \%data);
  }
  return \@ret;
}

#just a test of concept... remember to remove this
sub all {
    my ($self,$args) = @_;

    my @results;
    push(@results, @{variation($self,$args)});
    push(@results, @{gene($self,$args)});
    push(@results, @{paper($self,$args)});

   foreach my $class (qw(sequence expression_cluster gene_class protein antibody phenotype)) {
      $args->{'class'} = $class;
      push(@results, @{basic($self,$args)});
      push(@results, @{paper($self,$args)});
   }

   return \@results;
}

no Moose;
__PACKAGE__->meta->make_immutable;

1;
